(function() { 'use strict';

  const { all, getSize, one, onEvent, onReady } = lib.dom;

  const receive = (s, e, ...a) => {
    console.log('<', e, ...a);
  };
  const emit = (s, e, ...a) => {
    console.log('>', e, ...a);
    s.emit(e, ...a);
  };
  const on = (s, e, f, ...a) => s.on(e, (...ar) => {
    receive(s, e, ...ar);
    return f && f(...ar) || undefined;
  }, ...a);

  const fullscreenMobile = false;
  if (lib.env.isMobile) {
    document.body.classList.add('mobile');
  }

  onReady(() => {
    const appEl = one('#app');
    const viewsEl = one('#views');

    if (lib.env.isMobile && fullscreenMobile) {
      onEvent(document, 'click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        }
      });
    }

    let name;
    const chat = one('#chat');
    const chatLog = one('#chat-log');
    const sendChat = () => {
      const { value } = chat;
      if (value) {
        emit(socket, 'chat', value);
        chat.value = '';
      }
    };
    onEvent(one('#chat'), 'keydown', e => {
      if (e.key === 'Enter') {
        sendChat();
      }
    });
    onEvent(one('#chat-send'), 'click', sendChat);

    const views = {};
    const registerView = (id, tpl, fn) => {
      if (views[id]) {
        return;
      }
      views[id] = { id, tpl, fn };
    };
    const addView = id => {
      const view = views[id];
      if (!view || view.els) {
        return;
      }
      const frag = view.tpl.content.cloneNode(true);
      view.els = [].slice.call(frag.children);
      viewsEl.appendChild(frag);
      if (typeof view.fn === 'function') {
        view.fn();
      }
    };
    const removeView = id => {
      const view = views[id];
      if (!view || !view.els) {
        return;
      }
      view.els.forEach(el => el.remove());
      view.els = null;
    };
    let viewStack = [];
    const renderView = () => {
      const last = viewStack[viewStack.length - 1];
      if (!last) {
        return;
      }
      addView(last);
    };
    const pushView = id => {
      const last = viewStack[viewStack.length - 1];
      const view = views[id];
      if (last === id || !view) {
        return;
      }
      if (last) {
        removeView(last);
      }
      viewStack.push(id);
      renderView();
    };
    const popView = id => {
      const last = viewStack[viewStack.length - 1];
      if (viewStack.length <= 1 || !last || id && id !== last) {
        return;
      }
      removeView(last);
      viewStack.pop();
      renderView();
    };

    registerView('grid-list', one('#tpl-grid-list'), () => {
      all('.grid-list-group').forEach(el =>
        onEvent(el, 'click', e => {
          popView('grid-config');
          emit(socket, 'chat', 'Grids: ' + el.textContent.trim());
        })
      );
      all('.grid-list-grid').forEach(el =>
        onEvent(el, 'click', e => {
          popView('grid-config');
          emit(socket, 'chat', 'Grid: ' + el.textContent.trim());
        })
      );
      onEvent(one('#add-grid'), 'click', e => {
        pushView('grid-config');
      });
    });
    registerView('grid-config', one('#tpl-grid-config'), () => {
      onEvent(one('#grid-config-cancel'), 'click', e => {
        popView('grid-config');
      });
      onEvent(one('#grid-config-ok'), 'click', e => {
        const name = (one('#grid-name') || {}).value;
        const width = (one('#grid-width') || {}).value;
        const height = (one('#grid-height') || {}).value;
        emit(socket, 'chat', `Add Grid: ${name} (${width}x${height})`);
        pushView('grid');
      });
    });
    registerView('grid', one('#tpl-grid'), () => {
      const grid = one('#grid');
      onEvent(one('#grid-back'), 'click', e => {
        popView('grid');
      });
      let unsubscribeResize = () => {};
      const setCanvasSize = () => {
        // TODO: cleanup event listener nicelier
        if (!grid || !grid.parentNode) {
          unsubscribeResize();
          return;
        }
        const { width, height } = getSize(grid.parentNode);
        Object.assign(grid, { width, height });
        const ctx = grid.getContext('2d');
        const s = 32;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        const o = ctx.lineWidth / 2;
        ctx.save();
        ctx.translate(o, o);
        ctx.moveTo(0, s);
        ctx.lineTo(0, 0);
        ctx.lineTo(s, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(-o, o);
        ctx.moveTo(width, s);
        ctx.lineTo(width, 0);
        ctx.lineTo(width - s, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(o, -o);
        ctx.moveTo(0, height - s);
        ctx.lineTo(0, height);
        ctx.lineTo(s, height);
        ctx.restore();
        ctx.save();
        ctx.translate(-o, -o);
        ctx.moveTo(width, height - s);
        ctx.lineTo(width, height);
        ctx.lineTo(width - s, height);
        ctx.restore();
        ctx.stroke();
      };
      unsubscribeResize = onEvent(window, 'resize', setCanvasSize);
      setCanvasSize();
    });
    pushView('grid-list');

    const socket = io();
    // Haven't seen this fire yet
    on(socket, 'connect_timeout');
    // Haven't seen this fire yet
    on(socket, 'error');
    // reason either ‘io server disconnect’, ‘io client disconnect’, or ‘ping timeout’
    // I've seen: 'transport close' when server killed
    on(socket, 'disconnect');
    // Occurs after 'disconnect' or 'reconnect_error'
    on(socket, 'reconnect_attempt');
    // Occurs after 'reconnect_attempt' (same attempt count)
    on(socket, 'reconnecting');
    // Occurs after 'reconnecting' when connection fails
    on(socket, 'connect_error');
    // Occurs after 'connect_error' when reconnecting fails
    on(socket, 'reconnect_error');
    // Fired when couldn’t reconnect within `reconnectionAttempts`
    // Not sure if we *want* to stop trying to connect
    on(socket, 'reconnect_failed');
    // Occurs after successful reconnection
    on(socket, 'reconnect');
    // Fired upon a connection including a successful reconnection.
    on(socket, 'connect');
    // Refresh if server commands
    let version;
    on(socket, 'version', v => {
      if (version && version !== v) {
        location.reload(true);
      }
      version = v;
    });
    on(socket, 'name', n => {
      name = n;
    });
    // Get player chatter
    on(socket, 'chat', (user, text) => {
      const { create } = lib.dom;
      const log = create('div', { attrs: { class: 'chat-log' } });
      const serverClass = !user ? ' chat-text--server' : '';
      const serverUserClass = !user ? ' chat-user--server' : '';
      const serverDelimClass = !user ? ' chat-delim--server' : '';
      const userClass = user === name || user === socket.id ? ' chat-user--local' : serverUserClass;
      create('span', { attrs: { class: `chat-user${userClass}` }, appendTo: log, content: user });
      create('span', { attrs: { class: `chat-delim${serverDelimClass}` }, appendTo: log, content: ': ' });
      create('span', { attrs: { class: `chat-text${serverClass}` }, appendTo: log, content: text });
      chatLog.appendChild(log);
      chatLog.scrollTop = chatLog.scrollHeight;
    });
  });

})();
