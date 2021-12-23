
var app = require('express')();
require("dotenv").config();
var cors = require('cors')
var server = require('http').Server(app);
const webhookControllers = require('./controllers/webhook.controller')
const { urlencoded, json } = require('body-parser')
// Parse application/x-www-form-urlencoded
app.use(urlencoded({ extended: true }));


// Parse application/json
app.use(json());
// const io = require('socket.io')(server, {
// 	cors: {
// 	  origin: '*',
// 	}
//   });
  app.use(cors())
  app.use(function(req,res,next){
	req.io = io;
	next();
	})
  const socketClient = require("socket.io-client")('https://frozen-mesa-23401.herokuapp.com',{
	reconnection: true,
	reconnectionDelay: 10000
  })

var five = require("johnny-five"); //Gọi thư viện Johnny-five

  var board = new five.Board(); //Tạo board Arduino từ thư viện
   
  
  server.listen(process.env.PORT || 80, () => {
	console.log("Listening on port 80");
  });

  var iot = {};

  board.on("ready", function() { //Arduino đã sẵn sàng làm việc rồi(đây là một sự kiện, nó sẽ diễn ra khi board Arduino đã sẵn sàng cho việc lập trình)
	  
	//   var led = new five.Led(13); //Khai báo led ở chân số 13
	  iot.status = "ready";
	  iot.led = new five.Led(13)
  

  
  });
iot.startBlink = function() {
    console.log("startBlink called");
	iot.led.blink(100);
};
iot.stopBlink = function() {
    console.log("stopBlink called");
    iot.led.stop();
};

iot.ledON = function() {
    console.log("ledON called");
    iot.led.on();
};

iot.ledOFF = function() {
    console.log("ledON called");
    iot.led.stop().off();
};
// io.on('connection', function(socket) { //sau khi client kết nối tới server 
// 	//khi server nhận được yêu cầu "bật" từ client
// 	socket.on('joinRoom', (room) => {
// 		console.log('someone join', room)
// 		socket.join(room)
// 	})
// 	socket.on('on', () =>{
// 		console.log('bật')
// 		io.in('arduino').emit('onLed', 'arduino');
// 		// socket.in('room1').emit('update', 'arduino');
// 	});
// 	//khi server nhận được yêu cầu "tắt" từ client
// 	socket.on('off', function() {
// 		console.log("tắt")
// 	});
// 	//khi server nhận được yêu cầu "nhấp nháy" từ client
// 	socket.on('blink', function() {
// 		console.log("nhấp nháy")
// 	});
// });
// if(process.env.envi === 'dev'){
// 	  socketClient.on('connect', () =>{
// 		  socketClient.emit('joinRoom', 'arduino');
// 		  console.log('connect client')

// 	  })
// 	  socketClient.on('update', function (room) {
// 		console.log(room);
// 	  });
// 	  socketClient.on("blink", () =>{
// 		console.log('123')
// 	})
// 	socketClient.on("serverOn", () =>{
// 		console.log('dkm')
// 	})
// 	socketClient.on("onLed", () =>{
// 		iot.ledON()
// 		console.log('onled')
// 	})
// 	socketClient.on("offLed", () =>{
// 		console.log('led off')
// 		iot.ledOFF()
// 	})
// 	socketClient.on("blinkLed", () =>{
// 		console.log('led blink')
// 		iot.startBlink()
// 	})
// 	socketClient.on('disconnect', (reason) => {
// 		console.log("client disconnected");
// 		if (reason === 'io server disconnect') {
// 		  // the disconnection was initiated by the server, you need to reconnect manually
// 		  console.log("server disconnected the client, trying to reconnect");
// 		  socketClient.connect();
// 		}else{
// 			console.log("trying to reconnect again with server");
// 		}
// 		// else the socket will automatically try to reconnect
// 	  });

// 	  socketClient.on('error', (error) => {
// 		console.log(error);
// 	});
// }
  app.get('/', function(req, res) { //tạo webserver khi truy nhập đường dẫn "/".
  console.log(process.env.envi)
//   if(process.env.envi === 'dev'){


//   io.on('connection', function(socket) { //sau khi client kết nối tới server 
// 	//khi server nhận được yêu cầu "bật" từ client
// 	console.log('CONNECT')
// 	socket.on('on', () =>{
// 		console.log('bật')
// 	});
// 	//khi server nhận được yêu cầu "tắt" từ client
// 	socket.on('off', function() {
// 		iot.ledOFF()
// 		console.log("tắt")
// 	});
// 	//khi server nhận được yêu cầu "nhấp nháy" từ client
// 	socket.on('blink', function() {
// 		iot.startBlink()
// 		console.log("nhấp nháy")
// 	});
// });
//   }

  res.sendfile(__dirname + '/index.html'); // thì mở nội dung ở file index.html lên
});

app.post('/on', (req,res) =>{
	console.log('ok')
	iot.ledON()
	res.send('ok')
})
app.post('/off', (req,res) =>{
	iot.ledOFF()
	res.send('ok')
})
app.post('/blink', (req,res) =>{
	iot.startBlink()
	res.send('ok')
})
app.get('/webhook', webhookControllers.getWebhook)
app.post('/webhook', webhookControllers.postWebhook)
module.exports = {
	iot: iot, 
	// io: io
}
console.log("Đã khởi động socket server")
  