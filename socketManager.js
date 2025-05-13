let onlineUsers = new Map();

const socketHandler = (io)=>{
  io.on('connection', (socket)=>{
    console.log('A user connected', socket.id);

    socket.on('user-connected', (userId)=>{
      onlineUsers.set(userId, socket.id)
    })

    socket.on('disconnect', ()=>{
      for(const [key, value] of onlineUsers.entries()){
        if(value === socket.id){
          onlineUsers.delete(key)
          break
        }
      }
      console.log('A user disconnected', socket.id);
    })

  })
}

const getSocketId = (userId)=>{
  return onlineUsers.get(userId)
}

module.exports = { socketHandler, getSocketId };