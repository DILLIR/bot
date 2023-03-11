const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const cheerio = require('cheerio');
const axios = require("axios");
const dotenv = require('dotenv');

dotenv.config();
const { TELEGRAM_TOKEN, TELEGRAM_USER } = process.env;

let user = TELEGRAM_USER;

// replace the value below with the Telegram token you receive from @BotFather
const token = TELEGRAM_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

let rawdata = fs.readFileSync('orders.json');

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

let orders = isJson(rawdata) ? JSON.parse(rawdata) : [];

async function main (){
    let i = 1;
    console.log("Parsing info...")
    let main_interval = setInterval(async () => {
        console.log(i);
        let response = await axios.get("https://freelance.ua/orders/?orders=web-development%2Cprikladnoj-programmist%2Cdatabases%2Cgame-programming%2Cembedded-systems%2Cplugins-scripts-utilities%2Csajt-pod-kljuch%2Conline-shops%2Crefinement-sites%2Cverstka%2Cwap-pda-sites%2Cusability%2Csearch-engines-optimization%2Cdatabase-administration&page="+i+"&pc=1");

        // let html = response.data;
    
        const $ = cheerio.load(response.data);
    
        let jobs = $(".l-projectList .j-order").filter(function(index, element){
            return $(this).find(".l-item-features").text().includes("сьогодні");
        });
    
        let pageOrders = [];

        jobs.each((index, element) => {
            let title = $(element).find(".l-project-title").text().replace(/[\r\n]/gm, '').trim(),
            link = $(element).find(".l-project-title a").attr("href"),
            desc = $(element).find("article").text().replace(/[\r\n]/gm, ' ').trim(),
            price = $(element).find(".l-price").text().trim(),
            type = $(element).find(".l-item-features li:first-child").text().trim();
            pageOrders.push({
                title,
                desc,
                link,
                price,
                type,
                day: new Date().getDate()
            })
        } )


        let filtered_orders = pageOrders.filter(pageOrder => {
            return !orders.find(order => order.link == pageOrder.link)
        } );
        orders = [...orders, ...filtered_orders].filter(item => item.day == new Date().getDate());

        if(pageOrders.length == 0){
            console.log("Parse ended");
            sendMessage(user);
            clearInterval(main_interval);
        }
        
        
        i++;

        
    }, 4000)



    

   
}
 function sendMessage(chatId){
    for(let order of orders){
        if(!order.sended){
            let orderText = `📘 ${order.title}\n\n${order.desc}\n\n💰 ${order.price}     💼 ${order.type}`;
            var options = {
                reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: "Відкрити замовлення", url: order.link }]
                ]
                })
            };
            bot.sendMessage(chatId, orderText, options);
            order.sended = true;
        }
    }
    fs.writeFile('orders.json', JSON.stringify(orders), function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
 }

 main();

 bot.on('message', (msg) => {
    const chatId = msg.chat.id;
  
    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, 'Received your message');
  });

let main_function = setInterval(main, 5*60*1000);