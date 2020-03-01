(function() { 'use strict';

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

  lib.dom.onReady(() => {
    if (lib.env.isMobile && fullscreenMobile) {
      lib.dom.onEvent(document, 'click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        }
      });
    }

    let name;
    const chat = lib.dom.one('#chat');
    const chatLog = lib.dom.one('#chat-log');
    const sendChat = () => {
      const { value } = chat;
      if (value) {
        emit(socket, 'chat', value);
        chat.value = '';
      }
    };
    lib.dom.onEvent(lib.dom.one('#chat'), 'keydown', e => {
      if (e.key === 'Enter') {
        sendChat();
      }
    });
    lib.dom.onEvent(lib.dom.one('#chat-send'), 'click', sendChat);

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
