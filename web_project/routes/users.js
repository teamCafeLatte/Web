const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
const   url = require('url');
const   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   session = require('express-session');
const   multer = require('multer');
const   router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));

const   db = mysql.createConnection({
   host: 'localhost',        // DB서버 IP주소
   port: 3306,               // DB서버 Port주소
   user: 'root',            // DB접속 아이디
   password: '1020',  // DB암호
   database: 'ournote'         //사용할 DB명
});

//  -----------------------------------  회원가입기능 -----------------------------------------
// 회원가입 입력양식을 브라우져로 출력합니다.
const PrintRegistrationForm = (req, res) => {
  let    htmlstream = '';

       htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/reg_form.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
       res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

       if (req.session.auth) {  // true :로그인된 상태,  false : 로그인안된 상태
           res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                             'logurl': '/users/logout',
                                             'loglabel': 'Logout',
                                             'regurl': '/users/profile',
                                             'reglabel':req.session.who }));
       }
       else {
          res.end(ejs.render(htmlstream, { 'title' : 'Our Note',
                                          'logurl': '/users/auth',
                                          'loglabel': 'Login',
                                          'regurl': '/users/reg',
                                          'reglabel':'가입' }));
       }

};

// 회원가입 양식에서 입력된 회원정보를 신규등록(DB에 저장)합니다.
const HandleRegistration = (req, res) => {  // 회원가입
let body = req.body;
let htmlstream='';

    console.log(body.uid);     // 임시로 확인하기 위해 콘솔에 출력해봅니다.
    console.log(body.pw1);
    console.log(body.name);
    console.log(body.phone);
    console.log(body.pic);

    if (body.uid == '' || body.pw1 == '' || body.name == '') {
         console.log("데이터입력이 되지 않아 DB에 저장할 수 없습니다.");
         res.status(561).end('<meta charset="utf-8">데이터가 입력되지 않아 가입을 할 수 없습니다');
    }
    else {

       db.query('INSERT INTO user (userID, userPass, userName, userPhone, userPic) VALUES (?, ?, ?, ?, ?)', [body.uid, body.pw1, body.name, body.phone, body.pic], (error, results, fields) => {
          if (error) {
            htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                               'warn_title':'회원가입 오류',
                               'warn_message':'이미 회원으로 등록되어 있습니다. 바로 로그인 하시기 바랍니다.',
                               'return_url':'/' }));
          } else {
           console.log("회원가입에 성공하였으며, 신규회원으로 등록되었습니다!");
           res.redirect('/');
          }
       });

    }
};

// REST API의 URI와 핸들러를 매핑합니다.
router.get('/reg', PrintRegistrationForm);   // 회원가입화면을 출력처리
router.post('/reg', HandleRegistration);   // 회원가입내용을 DB에 등록처리
router.get('/', function(req, res) { res.send('respond with a resource 111'); });

// ------------------------------------  로그인기능 --------------------------------------

// 로그인 화면을 웹브라우져로 출력합니다.
const PrintLoginForm = (req, res) => {
  let    htmlstream = '';

       htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/login_form.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
       res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

       if (req.session.auth) {  // true :로그인된 상태,  false : 로그인안된 상태
           res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                             'logurl': '/users/logout',
                                             'loglabel': 'Logout',
                                             'regurl': '/users/profile',
                                             'reglabel': req.session.who }));
       }
       else {
          res.end(ejs.render(htmlstream, { 'title' : 'Our Note',
                                          'logurl': '/users/auth',
                                          'loglabel': 'Login',
                                          'regurl': '/users/reg',
                                          'reglabel':'가입' }));
       }

};

// 로그인을 수행합니다. (사용자인증처리)
const HandleLogin = (req, res) => {
  let body = req.body;
  let userid, userpass, username;
  let sql_str;
  let htmlstream = '';

      console.log(body.uid);
      console.log(body.pass);
      if (body.uid == '' || body.pass == '') {
         console.log("아이디나 암호가 입력되지 않아서 로그인할 수 없습니다.");
         res.status(562).end('<meta charset="utf-8">아이디나 암호가 입력되지 않아서 로그인할 수 없습니다.');
      }
      else {
       sql_str = "SELECT userID, userPass, userName from user where userID ='"+ body.uid +"' and userPass='" + body.pass + "';";
       console.log("SQL: " + sql_str);
       db.query(sql_str, (error, results, fields) => {
         if (error) { res.status(562).end("Login Fail as No id in DB!"); }
         else {
            if (results.length <= 0) {  // select 조회결과가 없는 경우 (즉, 등록계정이 없는 경우)
                  htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                  res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                     'warn_title':'로그인 오류',
                                     'warn_message':'등록된 계정이나 암호가 틀립니다.',
                                     'return_url':'/' }));
             } else {  // select 조회결과가 있는 경우 (즉, 등록사용자인 경우)
               results.forEach((item, index) => {
                  userid = item.uid;  userpass = item.pass; username = item.name;
                  console.log("DB에서 로그인성공한 ID/암호:%s/%s", userid, userpass);
                  if (body.uid == userid && body.pass == userpass) {
                     req.session.auth = 99;      // 임의로 수(99)로 로그인성공했다는 것을 설정함
                     req.session.who = username; // 인증된 사용자명 확보 (로그인후 이름출력용)
                     if (body.uid == 'admin')    // 만약, 인증된 사용자가 관리자(admin)라면 이를 표시
                          req.session.admin = true;
                     res.redirect('/');
                  }
                }); /* foreach */
              } // else
            }  // else
       });
   }
}


// REST API의 URI와 핸들러를 매핑합니다.
//  URI: http://xxxx/users/auth
router.get('/auth', PrintLoginForm);   // 로그인 입력화면을 출력
router.post('/auth', HandleLogin);     // 로그인 정보로 인증처리

// ------------------------------  로그아웃기능 --------------------------------------

const HandleLogout = (req, res) => {
       req.session.destroy();     // 세션을 제거하여 인증오작동 문제를 해결
       res.redirect('/');         // 로그아웃후 메인화면으로 재접속
}

// REST API의 URI와 핸들러를 매핑합니다.
router.get('/logout', HandleLogout);       // 로그아웃 기능


// --------------- 정보변경 기능을 개발합니다 --------------------
const PrintProfile = (req, res) => {
  let    htmlstream = '';

       htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
       res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                           'warn_title':'계정정보 준비중',
                           'warn_message':'계정정보(예, 암호변경, 주소변경, 전화번호변경 등)변경기능을 추후에 개발할 예정입니다',
                          'return_url':'/' }));
}

router.get('/profile', PrintProfile);     // 정보변경화면을 출력

module.exports = router;
