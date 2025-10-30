const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');

const app = express();

app.set('view engine', 'jade');
app.set('views', './views');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: 'secret-key',       
  resave: false,
  saveUninitialized: true
}));

app.listen(3000, function () {
  console.log('Connected 3000 port!');
});

app.get('/home', function (req, res) {
  res.render('home');
});

app.get('/sign_up', function (req, res) {
  res.render('sign_up');
});

app.post('/sign_up', function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.send('입력값이 비어 있습니다.');
  }

  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }

  const userFile = `data/${username}`;

  if (fs.existsSync(userFile)) {
    return res.send('이미 존재하는 아이디입니다. <a href="/sign_up">다시 시도</a>');
  }

  fs.writeFile(userFile, password, function (err) {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.redirect('/sign_in');
  });
});

app.get('/sign_in', function (req, res) {
  res.render('sign_in');
});

app.post('/sign_in', function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const userFile = `data/${username}`;

  fs.readFile(userFile, 'utf8', function (err, data) {
    if (err) {
      return res.send('존재하지 않는 아이디입니다. <a href="/sign_in">다시 시도</a>');
    }

    if (data === password) {
      req.session.user = username; 
      res.redirect('/home_login');
    } else {
      res.send('비밀번호가 틀렸습니다. <a href="/sign_in">다시 시도</a>');
    }
  });
});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/home');
});

app.get('/home_login', function (req, res) {
  if (!req.session.user) {
    return res.redirect('/sign_in');
  }

  const postsFile = `data/${req.session.user}_posts.json`;
  let posts = [];

  if (fs.existsSync(postsFile)) {
    posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
  }

  res.render('home_login', { user: req.session.user, posts: posts });
});

app.post('/write', function (req, res) {
  if (!req.session.user) {
    return res.redirect('/sign_in');
  }

  const { title, content } = req.body;
  const postsFile = `data/${req.session.user}_posts.json`;

  let posts = [];
  if (fs.existsSync(postsFile)) {
    posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
  }

  posts.push({ title, content });
  fs.writeFileSync(postsFile, JSON.stringify(posts));

  res.redirect('/home_login');
});
