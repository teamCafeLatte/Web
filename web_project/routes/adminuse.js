const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
const   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   session = require('express-session');
const   multer = require('multer');
const   router = express.Router();

const   db = mysql.createConnection({
    host: 'localhost',        // DB서버 IP주소
    port: 3306,               // DB서버 Port주소
    user: 'root',            // DB접속 아이디
    password: '1020',  // DB암호
    database: 'ournote'         //사용할 DB명
});

//  -----------------------------------  회원리스트 기능 -----------------------------------------
// (관리자용) 등록된 사용자 리스트를 브라우져로 출력합니다.
const AdminPrintUser = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth && req.session.admin)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminuser.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT uid, name, phone, address, point, grade from u15_users;"; // 회원조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 회원조회 SQL실행
               if (error) { res.status(562).end("AdminPrintProd: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 회원이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                                      'warn_title':'친구 조회 오류',
                                      'warn_message':'조회된 친구가 없습니다. 친구를 추가해주세요!',
                                      'return_url':'/' }));
                   }
              else {  // 조회된 회원이 있다면, 회원리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                                       'logurl': '/users/logout',
                                                       'loglabel': 'Logout',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        udata : results }));  // 조회된 회원정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'친구 조회 오류',
                            'warn_message':'로그인되어 있지 않아서, 친구 조회를 할 수 없습니다.',
                            'return_url':'/' }));
       }

};

// ---------------------------------------회원정보검색기능---------------------------------------------
// 회원정보 검색을 위한 양식을 브라우저로 출력합니다.-친구추가
const PrintUserSearchEd = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';

       if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/user_search_edit.ejs','utf8'); // 회원 아이디 입력
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

         res.end(ejs.render(htmlstream, { 'title' : 'Our Note',
                                           'logurl': '/users/logout',
                                           'loglabel': 'Login',
                                           'regurl': '/users/profile',
                                           'reglabel': req.session.who}));
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'친구 추가 오류',
                            'warn_message':'로그인되어 있지 않아서, 친구 추가를 할 수 없습니다.',
                            'return_url':'/' }));
       }

};
// 친구삭제
const PrintUserSearchEr = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';

       if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/user_search_eraser.ejs','utf8'); // 회원 아이디 입력
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

         res.end(ejs.render(htmlstream, { 'title' : 'Our Note',
                                           'logurl': '/users/logout',
                                           'loglabel': 'Logout',
                                           'regurl': '/users/profile',
                                           'reglabel': req.session.who}));
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'친구 삭제 오류',
                            'warn_message':'로그인되어 있지 않아서, 친구 삭제를 할 수 없습니다.',
                            'return_url':'/' }));
       }
};

// ---------------------------------------회원정보변경기능---------------------------------------------
// 회원수정 양식을 브라우저로 출력합니다.
const PrintUserEdit = (req, res) => {
  let    body = req.body;
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/user_edit.ejs','utf8'); // 관리자화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         sql_str = "SELECT uid, pass, name, phone, address, point, grade from u15_users where uid = ?"; // 회원 검색 SQL

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

         db.query(sql_str, [body.uid], (error, results, fields) => {  // 회원 검색 SQL실행
           if(error) {res.status(562).end("PrintUserEdit: DB query is failed");}
           else if (results.length <= 0) { // 조회된 회원이 없다면, 오류메시지 출력
             htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
             res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                                'warn_title':'친구 조회 오류',
                                'warn_message':'조회된 친구가 없습니다. 추가할 친구를 다시 검색해주세요.',
                                'return_url':'/' }));
           }
           else{
             res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                               'logurl': '/users/logout',
                                               'loglabel': 'Logout',
                                               'regurl': '/users/profile',
                                               'reglabel': req.session.who,
                                                udata : results[0] }));  // 조회된 회원정보
           }
         });
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'친구 추가 오류',
                            'warn_message':'로그인되어 있지 않아서, 친구 추가를 할 수 없습니다.',
                            'return_url':'/' }));
       }

};

// 수정 양식에서 입력된 정보를 DB에 업데이트합니다.
const HanldleUserEdit = (req, res) => {  // 정보수정
  let    body = req.body;
  let    htmlstream = '';
  let    datestr;

       if (req.session.auth && req.session.admin) {
           if (body.uid == '' || datestr == '') {
             console.log("정보를 입력해주세요.");
             res.status(561).end('<meta charset="utf-8">아이디가 입력되지 않아 추가할 수 없습니다');
          }
          else {
              db.query('UPDATE u15_users SET pass=?, name=?, phone=?, address=?,point=?,grade=? where uid=?',
                    [body.pass, body.name, body.phone, body.address, body.point, body.grade, body.uid], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                                 'warn_title':'친구 추가 오류',
                                 'warn_message':'추가할때 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("정보수정에 성공하였습니다.!");
                   res.redirect('/adminuse/list');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'친구 추가 오류',
                            'warn_message':'로그인되어 있지 않아서, 친구 추가를 할 수 없습니다.',
                            'return_url':'/' }));
       }
};

// 회원 삭제 양식을 브라우저로 출력합니다.
const PrintUserEraser = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/user_eraser.ejs','utf8'); // 관리자화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         sql_str = "SELECT uid, pass, name, phone, address, point, grade from u15_users where uid = ?"; // 회원 검색 SQL

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

         db.query(sql_str, [req.param('uid')], (error, results, fields) => {  // 회원 검색 SQL실행
           if(error) {res.status(562).end("PrintUserEraser: DB query is failed");}
           else if (results.length <= 0) { // 조회된 회원이 없다면, 오류메시지 출력
             htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
             res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                                'warn_title':'친구 조회 오류',
                                'warn_message':'조회된 친구가 없습니다. 삭제할 친구를 다시 검색해주세요.',
                                'return_url':'/' }));
           }
           else{
             res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                               'logurl': '/users/logout',
                                               'loglabel': 'Logout',
                                               'regurl': '/users/profile',
                                               'reglabel': req.session.who,
                                                udata : results[0] }));  // 조회된 회원정보
           }
         });
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'친구 삭제 오류',
                            'warn_message':'로그인되어 있지 않아서, 친구 삭제 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};

//  선택된 회원을 DB에서 삭제합니다.
const HanldleEraserUser = (req, res) => {  // 회원삭제
  let    body = req.body;
  let    htmlstream = '';
  let    datestr;

       if (req.session.auth && req.session.admin) {
           if (body.uid == '' || datestr == '') {
             console.log("아이디가 입력되지 않아 데이터를 처리할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">친구가 선택되지 않아 삭제할 수 없습니다');
          }
          else {
              db.query('DELETE FROM u15_users where uid = ?',
                    [body.uid], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                                 'warn_title':'친구 삭제 오류',
                                 'warn_message':'친구를 삭제할때 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("친구 삭제에 성공하였습니다.!");
                   res.redirect('/adminuse/list');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'친구 삭제 오류',
                            'warn_message':'로그인되어 있지 않아서, 친구 삭제를 할 수 없습니다.',
                            'return_url':'/' }));
       }
};

// REST API의 URI와 핸들러를 매핑합니다.
router.post('/edit', PrintUserEdit);  // 회원정보변경화면을 출력처리
router.post('/user', HanldleUserEdit); //변경내용을 DB에 저장처리

router.get('/search/edit', PrintUserSearchEd);  // 상품정보검색화면을 출력처리-수정용
router.get('/search/eraser', PrintUserSearchEr);  // 상품정보검색화면을 출력처리-삭제용

router.post('/eraser', PrintUserEraser);   // 회원삭제화면을 출력처리
router.post('/user/eraser', HanldleEraserUser); // 회원삭제내용을 DB에 저장처리

router.get('/list', AdminPrintUser);      // 회원리스트를 화면에 출력
// router.get('/', function(req, res) { res.send('respond with a resource 111'); });

module.exports = router;
