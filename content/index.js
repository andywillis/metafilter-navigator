(function () {

  function qs(selector, context = document) {
    return context.querySelector(selector);
  }

  function qsa(selector, context = document) {
    return context.querySelectorAll(selector);
  }

  const webextName = 'navigator';
  let pickerVisible = false;

  /**
   * Grab the subsite name, the userId from
   * the site cookie, then proceed with generating
   * the list of user comments, and update each comment
   * with a minimal navigation section.
   */
  function init() {
    const site = getSite();
    const userId = getUserId();
    if (hasSite(site)) {
      addPicker(site);
      const userCommentsList = wrangleComments();
      highlightUserComments(userId, site);
      updateMultiComments(userCommentsList);
      addPickerListeners(userCommentsList, site);
    }
  }

  function getSite() {
    return document.location.host.split('.')[0];
  }

  function hasSite(site) {
    return [
      'www', 'ask', 'metatalk', 'fanfare',
      'projects', 'music', 'podcast'
    ].includes(site);
  }

  function getUserId() {
    const { cookie } = document;
    return cookie.match(/USER_ID=(\d+);/)[1];
  }

  function addPicker(site) {
    const html = `<div class="${site}color_bg_${webextName}" id="picker"></div>`;
    qs('body').insertAdjacentHTML('afterend', html);
  }

  /**
   * For each comment grab the list of links in the
   * smallcopy section, generate a userId and commentId,
   * and build up a dictionary of user/comment information.
   * For convenience add the userId to comment element.
   * @returns userComments object
   */
  function wrangleComments() {
    const userComments = {};
    qsa('.comments').forEach(function (comment) {
      const links = qsa('.smallcopy a', comment);
      if (links.length) {
        const userId = links[0].href.split('/').pop();
        const commentId = links[links[1].classList.contains('staff') ? 2 : 1].href;
        userComments[userId] = userComments[userId] || [];
        userComments[userId].push(commentId);
        comment.setAttribute('data-userid', userId);
      }
    });
    return reduceUserComments(userComments);
  }

  /**
   * If a user has only one comment remove the user
   * from the comment dictionary
   * @param {any} userComments
   * @returns Updated userComments
   */
  function reduceUserComments(userComments) {
    Object.keys(userComments).forEach(function (user) {
      if (userComments[user].length === 1) delete userComments[user];
    });
    return userComments;
  }

  /**
   * Iterate over the comment dictionary, and for each user
   * grab the comments written by that user, and attach the
   * navigation controls to the smallcopy section. If the
   * comments belong to the logged-in user highlight them.
   * @param {any} userCommentsList
   * @param {any} userId
   */
  function updateMultiComments(userCommentsList) {
    Object.keys(userCommentsList).forEach(function (user) {
      qsa(`.comments[data-userid="${user}"`).forEach(function (comment, index) {
        const template = buildTemplate(userCommentsList[user], user, index);
        qs('.smallcopy', comment).insertAdjacentHTML('beforeend', template);
      });
    });
  }

  function highlightUserComments(userId, site) {
    qsa(`.comments[data-userid="${userId}"]`).forEach(function (comment) {
      comment.classList.add(`${site}color_${webextName}`);
    });
  }

  /**
   * The template for the navigation controls. A left
   * arrow to go back one comment, a right arrow to go forward,
   * and a central list that shows all comments by that user,
   * numerically.
   * @param {any} userComments
   * @param {any} userId
   * @param {any} index
   * @returns Completed template
   */
  function buildTemplate(userComments, userId, index) {
    const previous = userComments[index - 1];
    const next = userComments[index + 1];
    return `<span class="navigator">[
      <span class="navprevious">
      ${previous ? `<a href="${previous}">«</a>` : '<span class="inactive">«</span>'}
      </span>
      <span class="pickerButton" data-commentid="${index}" data-userid="${userId}">≡
      </span>
      <span class="navnext">
      ${next ? `<a href="${next}">»</a>` : '<span class="inactive">»</span>'}
      </span>
    ] <span class="text">(${index + 1}/${userComments.length})</span></span>`.replace(/\n\s+/g, '');
  }

  /**
   * The central list, or picker, of the navigation
   * controls. Uses a simple HTML <ul> to capture
   * the clickable user comment links.
   * @param {any} userComments
   * @param {any} commentId
   * @returns picker HTML
   */
  function buildPicker(userComments, commentId, site) {
    const picker = [];
    picker.push(`<ul>`);
    const items = userComments.map((comment, index) => {
      if (commentId === index) return `<li class="${site}color_${webextName} inactive">${index + 1}</li>`;
      return `<li data-href="${comment}">${index + 1}</li>`;
    }).join('');
    picker.push(items);
    picker.push('</ul>');
    return picker.join('');
  }

  function addPickerListeners(userCommentsList, site) {
    qsa('.pickerButton').forEach(function (picker) {
      const userId = picker.getAttribute('data-userid');
      const commentId = parseInt(picker.getAttribute('data-commentid'), 10);
      const userComments = userCommentsList[userId];
      picker.addEventListener('click', showPicker.bind(this, userComments, commentId, site), false);
    });
  }

  function showPicker(userComments, commentId, site, event) {
    const html = buildPicker(userComments, commentId, site);
    const picker = qs('#picker');
    picker.innerHTML = html;
    picker.style.left = `${event.pageX}px`;
    picker.style.top = `${event.pageY}px`;
    picker.style.display = 'inline';
    picker.style.position = 'absolute';
    pickerVisible = true;
    qsa('li', picker).forEach(function (li) {
      li.addEventListener('click', gotoLink.bind(this, picker), false);
    });
    addPageListener(picker);
  }

  function addPageListener(picker) {
    qs('#page').addEventListener('click', hidePicker.bind(this, picker), false);
  }

  function removePageListener() {
    qs('#page').removeEventListener('click');
  }

  function hidePicker(picker, e) {
    if (pickerVisible && e.target.parentElement.className !== 'navigator') {
      picker.style.display = 'none';
      pickerVisible = false;
      removePageListener();
    }
  }

  function gotoLink(picker, e) {
    window.location.href = e.target.getAttribute('data-href');
    picker.style.display = 'none';
    qsa('li', picker).forEach(function (li) {
      li.removeEventListener('click');
    });
  }

  init();

}());
