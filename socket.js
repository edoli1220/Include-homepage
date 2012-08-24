var socket;

exports.setSocketIO = function(io) {
  io.set('log level', 2);
  io.sockets.on('connection', function (sio) {
    socket = sio;
    console.log('socket on');
  });
};

exports.socket = function() {
  if (socket) {
    return socket;  
  } else {
    return null;  
  }
}