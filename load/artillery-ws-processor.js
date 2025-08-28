'use strict';

module.exports = { sendPing };

function sendPing(context, events, done) {
  const loss = Number(process.env.PACKET_LOSS || 0.05);
  const start = Date.now();
  if (Math.random() > loss) {
    context.ws.send('ping');
  }
  context.ws.on('message', function () {
    const latency = Date.now() - start;
    events.emit('histogram', 'ws_latency', latency);
    done();
  });
  context.ws.on('close', () => done());
  setTimeout(() => {
    context.ws.close();
    done();
  }, 1000);
}
