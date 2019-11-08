const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
const   url = require('url');
const   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   multer = require('multer');
const   upload = multer({dest: __dirname + '/../public/images/uploads/userprofile'});  // 업로드 디렉터리를 설정한다.
const   router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));

const   db = mysql.createConnection({
   host: 'localhost',        // DB서버 IP주소
   port: 3306,               // DB서버 Port주소
   user: 'root',            // DB접속 아이디
   password: '1020',  // DB암호
   database: 'ournote'         //사용할 DB명
});

// --------------- 친구 리스트 기능 --------------------
const PrintFriendList = (req, res) => {
  let htmlstream = '';
  let sql_str;
  const query = url.parse(req.url, true).query;

  console.log(query.user);

  if(req.session.auth){ // 로그인한 경우에만 처리한다
    htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');  // 헤더부분
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8'); //메뉴
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/friend.ejs','utf8'); // 친구 리스트 화면
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

    sql_str = "SELECT userID, userName, userPic, userInfo from user where userID = ?"; // 친구 검색 SQL

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

    db.query(sql_str, query.user, (error, results, fields) => {  // 사용자 검색 SQL실행
      if(error) {res.status(562).end("PrintFriendList: DB query is failed");}
      else if (results.length <= 0) { // 조회된 정보가 없다면, 오류메시지 출력
        htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
        res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                          'warn_title':'조회 오류',
                          'warn_message':'조회된 정보가 없습니다.',
                          'return_url':'/' }));
      }
      else{
        res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                          'logurl': '/users/logout',
                                          'loglabel': 'Logout',
                                          'regurl': '/users/profile',
                                          'reglabel': req.session.who,
                                          userdata : results[0] }));  // 조회된 정보
      }
    });
  }
  else {
    htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
        res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                          'warn_title':'접근 오류',
                          'warn_message':'로그인이 필요합니다. 회원가입을 해주세요!',
                          'return_url':'/' }));
  }
}

router.get('/list', PrintFriendList);     // 친구 리스트 출력

module.exports = router;