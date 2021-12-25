require("dotenv").config();
const request = require("request");
const fetch = require("node-fetch");
const fs = require('fs');
const {HaNoi} = require('../db/hn')
let getHomepage = (req, res) => {
    return res.render("homepage.ejs");
};

let getWebhook = (req, res) => {
    console.log('webhook')
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = 'hieudev';

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
};

let postWebhook = (req, res) => {
    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log('post back 2', webhook_event?.postback)
            console.log('nlp', webhook_event?.message?.nlp?.entities);
            // if(webhook_event?.message?.text){
            //     if(webhook_event.message.text.includes('bật') ){
            //         req.io.in('arduino').emit('onLed', 'arduino');
            //     }
            //     if(webhook_event.message.text.includes('tắt') ){
            //         req.io.in('arduino').emit('offLed', 'arduino');
            //     }
            //     if(webhook_event.message.text.includes('nhấp')){
            //         req.io.in('arduino').emit('blinkLed', 'arduino');
            //     }
            // }
            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

};
function firstTrait(nlp, name) {
    return nlp && nlp.entities && nlp.traits[name] && nlp.traits[name][0];
  }
  
// Handles messages events
let handleMessage = (sender_psid, received_message) => {
    let response;
    const status = firstTrait(received_message.nlp, 'on-of');
    const entities = received_message?.nlp?.entities

    console.log('nlp2', received_message?.nlp?.entities)
    console.log('msg', received_message)
    console.log('status', status)

    if(received_message?.quick_reply?.payload){
        const arrayParams = received_message?.quick_reply?.payload.split('-')
        const content = fs.readFileSync(`${__dirname}/../db/restaurant/in_${arrayParams[3]}_${arrayParams[2]}.jl`, 'utf8');
            // console.log(typeof JSON?.parse(`[${content}]`), JSON?.parse(`[${content}]`)[0])
            const filterFood = JSON?.parse(`[${content}]`).filter(item => {
                return item.Name.toLowerCase().includes(arrayParams[1].toLowerCase())
            })
            console.log("logger", filterFood, arrayParams)
            const responseWithFood = filterFood.map(item =>{
                return(
                    {
                        "title":item.Name,
                        "image_url":item.PicturePath,
                        "subtitle": item.Address + ' - ' + item.District,
                        "buttons":[
                          {
                            "type":"web_url",
                            "url":`https://www.foody.vn${item.DetailUrl}`,
                            "title":"Xem chi tiết"
                          },
                          {
                            "type":"web_url",
                            "url":`http://www.google.com/maps/place/${item.Latitude},${item.Longitude}`,
                            "title":"Xem vị trí"
                          }
                        ]
                      }
                )
            })
            if(responseWithFood?.length){
                response = {
                    "attachment":{
                      "type":"template",
                      "payload":{
                        "template_type":"generic",
                        "elements":responseWithFood.slice(0,6)
                      }
                    }
                  }
            }else{
                response = {
                    text: "Hiện bot không tìm thấy!!!"
                }
            }

    }
    if(received_message?.nlp?.entities){
        if(entities['Food:Food'] && entities['Food:Food'][0].confidence > 0.7 ){
            if (entities['Location:Location']){
                if(entities['Location:Location'][0].confidence > 0.7){
                   const locationFilter = HaNoi.district.filter(item =>{
                        return item.name.toLowerCase().includes(entities['Location:Location'][0].value.toLowerCase())
                    })
                    console.log(locationFilter)
                    const content = fs.readFileSync(`${__dirname}/../db/restaurant/in_${locationFilter[0].province_id}_${locationFilter[0].id}.jl`, 'utf8');
                    const converted = JSON?.parse(`[${content}]`)
                    const filterFood = JSON?.parse(`[${content}]`).filter(item => {
                        return item.Name.toLowerCase().includes(entities['Food:Food'][0].value.toLowerCase())
                    })
                    const responseWithFood = filterFood.map(item =>{
                        return(
                            {
                                "title":item.Name,
                                "image_url":item.PicturePath,
                                "subtitle": item.Address + ' - ' + item.District,
                                "buttons":[
                                  {
                                    "type":"web_url",
                                    "url":`https://www.foody.vn${item.DetailUrl}`,
                                    "title":"Xem chi tiết"
                                  },
                                  {
                                    "type":"web_url",
                                    "url":`http://www.google.com/maps/place/${item.Latitude},${item.Longitude}`,
                                    "title":"Xem vị trí"
                                  }
                                ]
                              }
                        )
                    })
                    if(responseWithFood?.length){
                        response = {
                            "attachment":{
                              "type":"template",
                              "payload":{
                                "template_type":"generic",
                                "elements":responseWithFood.slice(0,6)
                              }
                            }
                          }
                    }else{
                        response = {
                            text: "Hiện bot không tìm thấy!!!"
                        }
                    }
                }
            }
            else{
                const quickRep = HaNoi.district.map(item =>{
                    return {
                        "content_type":"text",
                        "title": `${item.name}`,
                        "payload": `${item.name}-${entities['Food:Food'][0].value}-${item.id}-${item.province_id}`
                    }
                }) 
                response =  {
                    "text": "Chọn địa điểm",
                    "quick_replies": [...quickRep]
                    // "quick_replies":[
                    //     {
                    //         "content_type":"text",
                    //         "title": "Hoàn Kiếm",
                    //         "payload": `Hoàn Kiếm ${entities['Food:Food'][0].value}`
                    //     },
                    //     {
                    //         "content_type":"text",
                    //         "title": "Cầu Giấy",
                    //         "payload": `Cầu Giấy ${entities['Food:Food'][0].value}`
                    //     },
                    //     {
                    //         "content_type":"text",
                    //         "title": "Nam Từ Liêm",
                    //         "payload": `Nam Từ Liêm ${entities['Food:Food'][0].value}`
                    //     },
                    //     {
                    //         "content_type":"text",
                    //         "title": "Bắc Từ Liêm",
                    //         "payload": `Bắc Từ Liêm ${entities['Food:Food'][0].value}`
                    //     },
                    // ]
                  }
            }
        }
    }

    if (status && status.confidence > 0.8) {
        console.log(received_message.message)
        switch (status.value) {
            case 'blink':
                response = {
                    "text": 'Đèn đang nhấp nháy'
                }  
                break;
            case 'on':
                response = {
                    "text": 'Đèn đang bật'
                }  
                break;
            case 'off':
                response = {
                    "text": 'Đèn tắt'
                }  
                break
            default:
                break;
        }
       } else { 
      // default logic
      console.log('Dont Know', received_message)
      response = {
          text: "Bot chưa hiểu bạn hãy thử lại nhé"
      }
    }
    // Checks if the message contains text
    if (received_message.text) {
        // Create the payload for a basic text message, which
        // will be added to the body of our request to the Send API
        // response = {
        //     "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
        // }
    } else if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = { 
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes", 
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }

    // Send the response message
    callSendAPI(sender_psid, response);
};

// Handles messaging_postbacks events
let handlePostback = (sender_psid, received_postback) => {
    let response;
    console.log('post back', received_postback)
    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Thanks!" }
    } else if (payload === 'no') {
        response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
};

// Sends response messages via the Send API
let callSendAPI = (sender_psid, response) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v6.0/me/messages",
        "qs": { "access_token": 'EAA1Ymjy88YYBAFTyyFk739OjdTLbwThJdh0xyZAwuBnYdOPk1WhJQlZCOwOzrgTR1mqofM9ojkuObR0qk8URmSbWvMPjCQdAeAFq7VKY1hYPyGg9uZChCXVEdrfZBisR7ayWNwp23qiRkygZBELUoyXELUMwTGJrpbHPdk1LaraNAzmJ8cP9o' },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
};
module.exports = {
    getHomepage: getHomepage,
    getWebhook: getWebhook,
    postWebhook: postWebhook
};
