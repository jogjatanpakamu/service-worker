(function Blog(global) {
  'use strict';

  var offlineIcon;
  var isOnline = 'onLine' in navigator ? navigator.onLine : true;
  var isLoggedIn = /isLoggedIn=1/.test(document.cookie.toString() || '');
  var usingSW = 'serviceWorker' in navigator;
  var swRegistration;
  var svcworker;

  if (usingSW) {
    initServiceWorker().catch(console.error);
  }

  global.isBlogOnline = isBlogOnline;

  document.addEventListener('DOMContentLoaded', ready, false);

  // **********************************

  function ready() {
    offlineIcon = document.getElementById('connectivity-status');

    if (!isOnline) {
      offlineIcon.classList.remove('hidden');
    }

    window.addEventListener('online', function online() {
      offlineIcon.classList.add('hidden');
      isOnline = true;
      sendStatusUpdate();
    });

    window.addEventListener('offline', function offline() {
      offlineIcon.classList.remove('hidden');
      isOnline = false;
      sendStatusUpdate();
    });
  }

  function isBlogOnline() {
    return isOnline;
  }

  async function initServiceWorker() {
    swRegistration = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none',
    });

    svcworker =
      swRegistration.installing ||
      swRegistration.waiting ||
      swRegistration.active;
    sendStatusUpdate(svcworker);

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      function onController() {
        svcworker = navigator.serviceWorker.controller;
        sendStatusUpdate(svcworker);
      }
    );

    navigator.serviceWorker.addEventListener('message', onSWMessage);
  }

  function onSWMessage(event) {
    var {data} = event;
    if (data.requestStatusUpdate) {
      console.log(
        'Received status update request from service worker, responding...'
      );
      // message channel
      sendStatusUpdate(event.ports && event.ports[0]);
    } else if (data == 'force-logout') {
      document.cookie = 'isLoggedIn=';
      isLoggedIn = false;
      sendStatusUpdate();
    }
  }

  function sendStatusUpdate(target) {
    sendSWMessage({statusUpdate: {isOnline, isLoggedIn}}, target);
  }

  function sendSWMessage(msg, target) {
    if (target) {
      target.postMessage(msg);
    } else if (svcworker) {
      svcworker.postMessage(msg);
    } else {
      navigator.serviceWorker.controller.postMessage(msg);
    }
  }
})(window);
