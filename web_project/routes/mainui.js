// 메인화면 출력파일
const  express = require('express');
const  ejs = require('ejs');
const   fs = require('fs');
const  router = express.Router();
var    loglevel = 1;

const  GetMainUI = (req, res) => {   // 메인화면을 출력합니다
let    htmlstream = '';

     logging(loglevel, 'router.get() invoked!');

   htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
   htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 사용자메뉴
   htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/content.ejs','utf8'); // Content
   htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

     res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
     if (req.session.auth) {  // true :로그인된 상태,  false : 로그인안된 상태
         res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                           'logurl': '/users/logout',
                                           'loglabel': 'Logout',
                                           'regurl': '/users/profile',
                                           'user':req.session.who }));  // 세션에 저장된 사용자명표시
     }
     else {
        res.end(ejs.render(htmlstream, { 'title' : 'Our Note',
                                        'logurl': '/users/auth',
                                        'loglabel': 'Login',
                                        'regurl': '/users/reg',
                                        'user':'가입' }));
     }

};

const logging = (level, logmsg) => {
       if (level != 0) {
         console.log(level, logmsg)
         loglevel++;
      }
}

// ‘/’ get 메소드의 핸들러를 정의
router.get('/', GetMainUI);

// 외부로 뺍니다.
module.exports = router
