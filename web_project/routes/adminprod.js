const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
const   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   session = require('express-session');
const   multer = require('multer');
const   upload = multer({dest: __dirname + '/../public/images/uploads/products'});  // 업로드 디렉터리를 설정한다.
const   router = express.Router();

const   db = mysql.createConnection({
    host: 'localhost',        // DB서버 IP주소
    port: 3306,               // DB서버 Port주소
    user: 'root',            // DB접속 아이디
    password: '1020',  // DB암호
    database: 'ournote'         //사용할 DB명
});

//  -----------------------------------  상품리스트 기능 -----------------------------------------
// (관리자용) 등록된 상품리스트를 브라우져로 출력합니다.
const AdminPrintProd = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminproduct.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
          //  sql_str = "SELECT itemid, category, maker, pname, modelnum, rdate, price, amount from u15_products order by rdate desc;"; // 상품조회SQL
           sql_str = "SELECT docID, userID, title, date from document order by date desc;"; // 문서조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행
               if (error) { res.status(562).end("AdminPrintProd: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                                      'warn_title':'조회 오류',
                                      'warn_message':'조회된 글이 없습니다.',
                                      'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                                       'logurl': '/users/logout',
                                                       'loglabel': 'Logout',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        prodata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // 로그인하지 않고 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'로그인 필요',
                            'warn_message':'보관함을 이용하려면, 로그인이 필요합니다.',
                            'return_url':'/' }));
       }

};

//  -----------------------------------  상품등록기능 -----------------------------------------
// 상품등록 입력양식을 브라우져로 출력합니다.
const PrintAddProductForm = (req, res) => {
  let    htmlstream = '';

       if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/product_form.ejs','utf8'); // 괸리자메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
         res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                           'logurl': '/users/logout',
                                           'loglabel': 'Logout',
                                           'regurl': '/users/profile',
                                           'reglabel': req.session.who }));
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'등록 오류',
                            'warn_message':'로그인되어 있지 않아서, 게시글을 등록 할 수 없습니다.',
                            'return_url':'/' }));
       }

};

// 상품등록 양식에서 입력된 상품정보를 신규로 등록(DB에 저장)합니다.
const HanldleAddProduct = (req, res) => {  // 상품등록
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, y, m, d, regdate;
  let    prodimage = '/images/uploads/products/'; // 상품이미지 저장디렉터리
  let    picfile = req.file;

       console.log(body);

       if (req.session.auth) {
           if (body.itemid == '' || datestr == '') {
             console.log("상품번호가 입력되지 않아 DB에 저장할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">상품번호가 입력되지 않아 등록할 수 없습니다');
          }
          else {
              if(picfile){
                let    result = { originalName  : picfile.originalname,
                                 size : picfile.size     }
                prodimage = prodimage + picfile.filename;
                console.log("사진있음");
              }else {
                console.log("사진없음");
              }
              regdate = new Date();
              db.query('INSERT INTO u15_products (docID, docPass, userID, title, filePath ,date) VALUES (?, ?, ?, ?, ?, ?)',
                    [body.docid, body.docpw, body.uid, body.title, prodimage, regdate], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                 'warn_title':'상품등록 오류',
                                 'warn_message':'상품으로 등록할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("상품등록에 성공하였으며, DB에 신규상품으로 등록하였습니다.!");
                   res.redirect('/adminprod/list');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품등록기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }
};

// ---------------------------------------상품정보검색기능---------------------------------------------
// 변경할 상품 검색을 위한 양식을 브라우저로 출력합니다.
const PrintProductSearchEd = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';

       if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/product_search_edit.ejs','utf8'); // 상품번호 입력
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

         res.end(ejs.render(htmlstream, { 'title' : 'Our Note',
                                           'logurl': '/users/logout',
                                           'loglabel': 'Logout',
                                           'regurl': '/users/profile',
                                           'reglabel': req.session.who}));
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품변경 기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품변경 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};

const PrintProductSearchEr = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';

       if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/product_search_eraser.ejs','utf8'); // 상품번호 입력
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

         res.end(ejs.render(htmlstream, { 'title' : 'Our Note',
                                           'logurl': '/users/logout',
                                           'loglabel': 'Logout',
                                           'regurl': '/users/profile',
                                           'reglabel': req.session.who}));
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품삭제 기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품삭제 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};

// ---------------------------------------상품변경기능---------------------------------------------
// 상품변경 양식을 브라우저로 출력합니다.
const PrintProductEdit = (req, res) => {
  let    body = req.body;
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/product_edit.ejs','utf8'); // 관리자메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         sql_str = "SELECT itemid, category, maker, pname, modelnum, rdate, price, dcrate, amount, event, pic from u15_products where itemid = ?"; // 상품 검색 SQL

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

         db.query(sql_str, [body.itemid], (error, results, fields) => {  // 상품 검색 SQL실행
           if(error) {res.status(562).end("PrintProductEdit: DB query is failed");}
           else if (results.length <= 0) { // 조회된 상품이 없다면, 오류메시지 출력
             htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
             res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                'warn_title':'조회 오류',
                                'warn_message':'조회된 데이터가 없습니다.',
                                'return_url':'/' }));
           }
           else{
             res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                               'logurl': '/users/logout',
                                               'loglabel': 'Logout',
                                               'regurl': '/users/profile',
                                               'reglabel': req.session.who,
                                                prodata : results[0] }));  // 조회된 상품정보
           }
         });
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'제품변경 기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 제품변경 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};

// 상품변경 양식에서 입력된 상품정보를 DB에 업데이트합니다.
const HanldleProductEdit = (req, res) => {  // 상품변경
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, delfile, pic;
  let    prodimage = '/images/uploads/products/'; // 상품이미지 저장디렉터리
  let    picfile = req.file;

        console.log(body);
        console.log(picfile);

       if (req.session.auth) {
           if (body.itemid == '' || datestr == '') {
             console.log("상품번호가 입력되지 않아 DB에 저장할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">상품번호가 입력되지 않아 등록할 수 없습니다');
          }
          else {
            db.query('SELECT pic from u15_products where itemid=?',[body.itemid], (error, data) => {
              if (error) {
                console.log("에러닷");
              }else if(data[0]==prodimage){ //원래 이미지가 없는 경우-그냥 넣어주면됌
                let    result = { originalName  : picfile.originalname,
                                 size : picfile.size     }
                prodimage = prodimage + picfile.filename;
                console.log(data);

                db.query('UPDATE u15_products SET category=?, maker=?, pname=?, modelnum=?, price=?, dcrate=?, amount=?, event=?, pic=? where itemid=?',
                      [body.category, body.maker, body.pname, body.modelnum,
                       body.price, body.dcrate, body.amount, body.event, prodimage, body.itemid], (error, results, fields) => {
                 if (error) {
                     htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                     res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                   'warn_title':'상품변경 오류',
                                   'warn_message':'상품을 변경할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                   'return_url':'/' }));
                  } else {
                     console.log("상품변경에 성공하였습니다.!");
                     /*if (picfile&&pic) {  //기존이미지와 변경되는 이미지가 모두 존재할 경우
                       fs.unlink(delfile, (error, result) => {
                         if(error) {console.error("error3");
                         console.log(delfile);
                       }
                         else console.log('파일이 삭제되었습니다.');  //기존이미지 삭제
                       });
                     }*/
                     res.redirect('/adminprod/list');
                  }
             });

              }else{  //원래 이미지가 존재하는 경우
                pic=data;
                if(picfile){//이미지 변경 있음
                  let    result = { originalName  : picfile.originalname,
                                   size : picfile.size     }
                  prodimage = prodimage + picfile.filename;
                  delfile = pic;
                  console.log("사진변경있음");
                  console.log(delfile);
                  console.log(prodimage);
                }else{  //이미지 변경 없음
                  prodimage = pic;
                  console.log("사진변경없음");
                }

                db.query('UPDATE u15_products SET category=?, maker=?, pname=?, modelnum=?, price=?, dcrate=?, amount=?, event=?, pic=? where itemid=?',
                      [body.category, body.maker, body.pname, body.modelnum,
                       body.price, body.dcrate, body.amount, body.event, prodimage, body.itemid], (error, results, fields) => {
                 if (error) {
                     htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                     res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                   'warn_title':'상품변경 오류',
                                   'warn_message':'상품을 변경할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                   'return_url':'/' }));
                  } else {
                     console.log("상품변경에 성공하였습니다.!");
                     /*if (picfile&&pic) {  //기존이미지와 변경되는 이미지가 모두 존재할 경우
                       fs.unlink(delfile, (error, result) => {
                         if(error) {console.error("error3");
                         console.log(delfile);
                       }
                         else console.log('파일이 삭제되었습니다.');  //기존이미지 삭제
                       });
                     }*/
                     res.redirect('/adminprod/list');
                  }
             });
              }
            });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품변경 기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품변경 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }
};

// 상품삭제 양식을 브라우저로 출력합니다.
const PrintProductEraser = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  let   body = req.body;

       if (req.session.auth) { // 관리자로 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/product_eraser.ejs','utf8'); // 관리자메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         sql_str = "SELECT itemid, category, maker, pname, modelnum, rdate, price, dcrate, amount, event, pic from u15_products where itemid = ?"; // 상품 검색 SQL

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

         db.query(sql_str, [body.itemid], (error, results, fields) => {  // 상품 검색 SQL실행
           if(error) {res.status(562).end("PrintProductEraser: DB query is failed");}
           else if (results.length <= 0) { // 조회된 상품이 없다면, 오류메시지 출력
             htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
             res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                'warn_title':'조회 오류',
                                'warn_message':'조회된 데이터가 없습니다.',
                                'return_url':'/' }));
           }
           else{
             console.log(results);
             res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                               'logurl': '/users/logout',
                                               'loglabel': 'Logout',
                                               'regurl': '/users/profile',
                                               'reglabel': req.session.who,
                                                prodata : results[0],
                                               'category': results.category}));  // 조회된 상품정보
           }
         });
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품삭제 기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품삭제 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }

};

//  선택된 상품을 DB에서 삭제합니다.
const HanldleProductEraser = (req, res) => {  // 상품삭제
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, delfile;

       //delfile=body.pic;

       if (req.session.auth) {
           if (body.itemid == '' || datestr == '') {
             console.log("상품이 입력되지 않아 데이터를 처리할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">상품이 선택되지 않아 삭제할 수 없습니다');
          }
          else {
              db.query('DELETE FROM u15_products where itemid = ?',
                    [body.itemid], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                 'warn_title':'상품삭제 오류',
                                 'warn_message':'상품을 삭제할때 DB 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("상품삭제에 성공하였습니다.!");
                   /*fs.unlink('delfile', (error) => {
                     if(error) console.error(error);
                     console.log('파일이 삭제되었습니다.');
                   });*/
                   res.redirect('/adminprod/list');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품삭제 기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품삭제 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }
};

// REST API의 URI와 핸들러를 매핑합니다.
router.get('/form', PrintAddProductForm);   // 상품등록화면을 출력처리
router.post('/product', upload.single('photo'), HanldleAddProduct); // 상품등록내용을 DB에 저장처리

router.get('/product/search/edit', PrintProductSearchEd);  // 상품정보검색화면을 출력처리-수정용
router.get('/product/search/eraser', PrintProductSearchEr);  // 상품정보검색화면을 출력처리-삭제용

router.post('/edit', PrintProductEdit);  // 상품변경화면을 출력처리
router.post('/product/edit', upload.single('photoedit'), HanldleProductEdit); //상품변경내용을 DB에 저장처리

router.post('/eraser', PrintProductEraser);   // 상품삭제화면을 출력처리
router.post('/product/eraser', HanldleProductEraser); // 상품삭제내용을 DB에 처리

router.get('/list', AdminPrintProd);      // 상품리스트를 화면에 출력
// router.get('/', function(req, res) { res.send('respond with a resource 111'); });

module.exports = router;
