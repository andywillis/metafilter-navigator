(function () {

  function qs(selector, context = document) {
    return context.querySelector(selector);
  }

  function qsa(selector, context = document) {
    return context.querySelectorAll(selector);
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

  function reduceUserComments(userComments) {
    Object.keys(userComments).forEach(function (user) {
      if (userComments[user].length === 1) delete userComments[user];
    });
    return userComments;
  }

  function wrangleComments() {
    const userComments = {};
    qsa('.comments').forEach(function (comment) {
      const links = qsa('.smallcopy a', comment);
      if (links.length) {
        const userId = links[0].href.split('/').pop();
        const commentId = links[1].href;
        userComments[userId] = userComments[userId] || [];
        userComments[userId].push(commentId);
        comment.setAttribute('data-userid', userId);
      }
    });
    return reduceUserComments(userComments);
  }

  function buildPicker(userComments, commentId) {
    const picker = [];
    picker.push('<ul>');
    const items = userComments.map((comment, index) => {
      if (commentId === index) return `<li>${index}</li>`;
      return `<li data-href="${comment}" class="active">${index}</li>`;
    }).join('');
    picker.push(items);
    picker.push('</ul>');
    return picker.join('');
  }

  function buildTemplate(userComments, userId, index) {
    const previous = userComments[index - 1];
    const next = userComments[index + 1];
    return `Navigation [
      <span class="navprevious">
      ${previous ? `<a href="${previous}">«</a></span>` : '«'}
      <span class="pickerButton" data-commentid="${index}" data-userid="${userId}">≡</span>
      <span class="navnext">
      ${next ? `<a href="${next}">»</a>` : '»'}
      </span>
    ]`;
  }

  function highlightUserComment(comment) {
    comment.classList.add('userpost');
  }

  function gotoLink(picker, e) {
    window.location.href = e.target.getAttribute('data-href');
    picker.style.display = 'none';
    qsa('li', picker).forEach(function (li) {
      li.removeEventListener('click');
    });
  }

  function showPicker(userComments, commentId, event) {
    const html = buildPicker(userComments, commentId);
    const picker = qs('#picker');
    picker.innerHTML = html;
    picker.style.left = `${event.pageX}px`;
    picker.style.top = `${event.pageY}px`;
    picker.style.display = 'inline';
    picker.style.position = 'absolute';
    qsa('li', picker).forEach(function (li) {
      li.addEventListener('click', gotoLink.bind(this, picker), false);
    });
  }

  function updateMultiComments(userCommentsList, userId) {
    Object.keys(userCommentsList).forEach(function (user) {
      qsa(`.comments[data-userid="${user}"`).forEach(function (comment, index) {
        if (userId === user) highlightUserComment(comment);
        const template = buildTemplate(userCommentsList[user], user, index);
        qs('.smallcopy', comment).insertAdjacentHTML('beforeend', template);
      });
    });
  }

  function addPickerListeners(userCommentsList) {
    qsa('.pickerButton').forEach(function (picker) {
      const userId = picker.getAttribute('data-userid');
      const commentId = parseInt(picker.getAttribute('data-commentid'), 10);
      const userComments = userCommentsList[userId];
      picker.addEventListener('click', showPicker.bind(this, userComments, commentId), false);
    });
  }

  function addPicker() {
    const html = '<div id="picker"></div>';
    qs('body').insertAdjacentHTML('afterend', html);
  }

  function init() {
    const site = getSite();
    const userId = getUserId();
    if (hasSite(site)) {
      const userCommentsList = wrangleComments();
      updateMultiComments(userCommentsList, userId);
      addPicker();
      addPickerListeners(userCommentsList);
    }
  }

  init();

}());
