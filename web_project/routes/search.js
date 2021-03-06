const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
const   url = require('url');
const   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   session = require('express-session');
const   multer = require('multer');
// 업로드 디렉터리를 설정한다. 실제디렉터리: /home/bmlee/
// const  upload = multer({dest: __dirname + '/../uploads/products'});
const  router = express.Router();

// router.use(bodyParser.urlencoded({ extended: false }));
const   db = mysql.createConnection({
    host: 'localhost',        // DB서버 IP주소
    port: 3306,               // DB서버 Port주소
    user: 'root',            // DB접속 아이디
    password: '1020',  // DB암호
    database: 'ournote'         //사용할 DB명
});

//  -----------------------------------  상품리스트 기능 -----------------------------------------
// (관리자용) 등록된 상품리스트를 브라우져로 출력합니다.
const PrintSearchProd = (req, res) => {
  let    body = req.body;
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str, search_name;

       console.log(body.search);

       if (req.session.auth)   {   // 로그인된 경우에만 처리한다

           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 사용자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/search.ejs','utf8'); // 제품검색
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
        //    sql_str = "SELECT maker, pname, modelnum, price, pic from u15_products where pname like ? order by rdate desc;"; // 상품조회SQL
        sql_str = "SELECT docID, title, userID, date from document where title like ? order by date desc;"; // 게시글조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, ["%"+body.search+"%"], (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("PrintSearchProd: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                                      'warn_title':'검색 오류',
                                      'warn_message':'검색 결과가 없습니다.',
                                      'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                                       'logurl': '/users/logout',
                                                       'loglabel': 'Logout',
                                                       'regurl': '/users/profile',
                                                       'user': req.session.who,
                                                       'title': body.search,
                                                        docdata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'로그인 필요',
                            'warn_message':'검색을 하려면, 로그인이 필요합니다.',
                            'return_url':'/' }));
       }
};

//---------------------------------------------- my post --------------------------------------------------
const PrintProdMy = (req, res) => {
    let    body = req.body;
    let    htmlstream = '';
    let    htmlstream2 = '';
    let    sql_str;
    const query = url.parse(req.url, true).query;
  
         if (req.session.auth)   {   // 로그인된 경우에만 처리한다
             htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
             htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 사용자메뉴
             htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/mypost.ejs','utf8'); // 괸리자메인화면
             htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
          //    sql_str = "SELECT maker, pname, modelnum, price, pic from u15_products where pname like ? order by rdate desc;"; // 상품조회SQL
          sql_str = "SELECT docID, title, userID, date from document where userID = ?"; // 게시글조회SQL
  
             res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
  
             db.query(sql_str, query.user, (error, results, fields) => {  // 상품조회 SQL실행
                 if (error) { res.status(562).end("PrintProdMy: DB query is failed"); }
                //  else if (results.length <= 0) {  // 조회된 글이 없다면, 오류메시지 출력
                //      htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                //      res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                //                         'warn_title':'조회 오류',
                //                         'warn_message':'조회된 글이 없습니다.',
                //                         'return_url':'/' }));
                //      }
                else {  // 조회된 상품이 있다면, 상품리스트를 출력
                       res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                                         'logurl': '/users/logout',
                                                         'loglabel': 'Logout',
                                                         'regurl': '/users/profile',
                                                         'user': req.session.who,
                                                          docdata : results }));  // 조회된 상품정보
                   } // else
             }); // db.query()
         }
         else  {  // (로그인하지 않고) 본 페이지를 참조하면 오류를 출력
           htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
           res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                              'warn_title':'접근 오류',
                              'warn_message':'사용자의 게시물을 확인하려면, 로그인이 필요합니다.',
                              'return_url':'/' }));
         }
  };

// REST API의 URI와 핸들러를 매핑합니다.
router.post('/list', PrintSearchProd);      // 상품리스트를 화면에 출력  
router.get('/post', PrintProdMy);  //mypost를 화면에 출력

module.exports = router;
