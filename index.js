// -----------------------------------------------------------------------------
// モジュールのインポート
const server = require("express")();
const line = require("@line/bot-sdk"); // Messaging APIのSDKをインポート
let MeCab = new require("mecab-async");
let mecab = new MeCab();
MeCab.command = "mecab -d /app/.linuxbrew/lib/mecab/dic/mecab-ipadic-neologd";


// -----------------------------------------------------------------------------
// パラメータ設定
const line_config = {
	channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
	channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
};

// -----------------------------------------------------------------------------
// Webサーバー設定
server.listen(process.env.PORT || 3000);

// APIコールのためのクライアントインスタンスを作成
const bot = new line.Client(line_config);



// -----------------------------------------------------------------------------
// ルーター設定
server.post('/bot/webhook', line.middleware(line_config), (req, res, next) => {
	// 先行してLINE側にステータスコード200でレスポンスする。
	res.sendStatus(200);

	// すべてのイベント処理のプロミスを格納する配列。
	let events_processed = [];


	// イベントオブジェクトを順次処理。
	req.body.events.forEach((event) => {
		// この処理の対象をイベントタイプがメッセージで、かつ、テキストタイプだった場合に限定。
		if (event.type === "message" && event.message.type === "text"){
			let morphs = mecab.parseSync(event.message.text);
			let replytext = new String();
			morphs.map(function(morph) {
				if (morph[8] == undefined) {
					if (morph[1] == undefined) replytext += '\n';
					else replytext += morph[0];
				} else {
					replytext += morph[8];
				}
			});
			if (replytext.indexOf("イカレ") >= 0) {
				replytext = replytext.replace(/イカレ/g, "カレー") + "ということですか？";
				events_processed.push(bot.replytext(event.replyToken, {
					type: "text",
					text: replytext
				}));
			}
		}
	});

	// すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
	Promise.all(events_processed).then(
		(response) => {
			console.log(`${response.length} event(s) processed.`);
		}
	);
});

server.get('/', (req, res) => {
	res.sendStatus(200);
});
