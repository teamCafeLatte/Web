const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
const   url = require('url');
const   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   session = require('express-session');
const   multer = require('multer');
const   upload = multer({dest: __dirname + '/../public/images/uploads/documents'});  // 업로드 디렉터리를 설정한다.
const   router = express.Router();

const   db = mysql.createConnection({
    host: 'localhost',        // DB서버 IP주소
    port: 3306,               // DB서버 Port주소
    user: 'root',            // DB접속 아이디
    password: '1020',  // DB암호
    database: 'ournote'         //사용할 DB명
});

//  -----------------------------------  글 리스트 기능 -----------------------------------------
const PrintDocList = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;

       if (req.session.auth)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/storage.ejs','utf8'); // 보관함 리스트
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

           sql_str = "SELECT docID, userID, title, date from document order by date desc;"; // 글 조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 글 조회 SQL실행
               if (error) { res.status(562).end("PrintDocList: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                                      'warn_title':'조회 오류',
                                      'warn_message':'조회된 글이 없습니다.',
                                      'return_url':'/' }));
                   }
              else {  // 조회된 글이 있다면, 리스트 출력
                     res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                                       'logurl': '/users/logout',
                                                       'loglabel': 'Logout',
                                                       'user': req.session.who,
                                                        docdata : results }));  // 조회된 상품정보
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

// ------------------------------------ 글 보기 기능 -----------------------------------------
// 글 보기 전 비밀번호 입력 양식을 브라우저로 출력합니다.
const PrintDocPWForm = (req, res) => {
  let htmlstream = '';
  let sql_str;
  const query = url.parse(req.url, true).query;
  
  console.log(query.index);  

    if (req.session.auth) { // 로그인된 경우에만 처리한다
      sql_str = "SELECT docPass from document where docID ='"+ query.index + "';";

      res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

      db.query(sql_str, (error, results, fields) => {  // 검색 SQL실행
        if(error) {res.status(562).end("PrintDocPWForm: DB query is failed");}
        else if (results[0].docPass == null || results[0].docPass == '') { // 비밀번호가 없는 경우, 바로 세부사항 출력
          console.log("?"+results[0].docPass);
          console.log("비밀번호가 없는 게시글입니다.");
          htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');  // 헤더부분
          htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8'); //메뉴
          htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/document.ejs','utf8'); // 메인화면
          htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

          sql_str = "SELECT docID, title, date, userID, filePath from document where docID = ?"; // 글 검색 SQL

          db.query(sql_str, query.index, (error, results, fields) => {  // 글 검색 SQL실행
            if(error) {res.status(562).end("PrintDocPWForm: DB query is failed");}
            else if (results.length <= 0) { // 조회된 글이 없다면, 오류메시지 출력
              htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
              res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                                'warn_title':'조회 오류',
                                'warn_message':'조회된 글이 없습니다.',
                                'return_url':'/storage/list' }));
            }
            else{
              res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                                'logurl': '/users/logout',
                                                'loglabel': 'Logout',
                                                'user': req.session.who,
                                                docdata : results[0] }));  // 조회된 상품정보
            }
          });
        }
        else{
          console.log(results);
          htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
          htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 메뉴
          htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/document_pw.ejs','utf8'); // 비밀번호 입력
          htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

          res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                            'logurl': '/users/logout',
                                            'loglabel': 'Logout',
                                            'user': req.session.who,
                                            'docID': query.index,
                                            docdata : results[0] }));  // 조회된 상품정보
        }
      });
    }
    else {
      htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
      res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                        'warn_title':'접근 오류',
                        'warn_message':'로그인되어 있지 않아서, 게시글을 볼 수 없습니다.',
                        'return_url':'/' }));
    }

};

// 글 보기 양식을 브라우저로 출력합니다.
const PrintDocDetail = (req, res) => {
  let body = req.body;
  let htmlstream = '';
  let htmlstream2 = '';
  const query = url.parse(req.url, true).query;

  if(req.session.auth){ // 로그인한 경우에만 처리한다
    htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');  // 헤더부분
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8'); //메뉴
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/document.ejs','utf8'); // 메인화면
    htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

    sql_str = "SELECT docID, title, date, userID, filePath from document where docID = ?"; // 글 검색 SQL

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

    db.query(sql_str, query.index, (error, results, fields) => {  // 글 검색 SQL실행
      if(error) {res.status(562).end("PrintDocDetail: DB query is failed");}
      else if (results.length <= 0) { // 조회된 글이 없다면, 오류메시지 출력
        htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
        res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                          'warn_title':'조회 오류',
                          'warn_message':'조회된 글이 없습니다.',
                          'return_url':'/storage/list' }));
      }
      else{
        res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                          'logurl': '/users/logout',
                                          'loglabel': 'Logout',
                                          'user': req.session.who,
                                          docdata : results[0] }));  // 조회된 글 정보
      }
    });
  }
  else {
    htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
        res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                          'warn_title':'접근 오류',
                          'warn_message':'로그인되어 있지 않아서, 게시글을 볼 수 없습니다.',
                          'return_url':'/' }));
  }
}

//  -----------------------------------  글 등록기능 -----------------------------------------
// 상품등록 입력양식을 브라우져로 출력합니다.
const PrintAddDocForm = (req, res) => {
  let    htmlstream = '';

       if (req.session.auth) { // 로그인된 경우에만 처리한다
         htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 메뉴
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/doc_form.ejs','utf8'); // 메인화면
         htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

         res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
         res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                           'logurl': '/users/logout',
                                           'loglabel': 'Logout',
                                           'user': req.session.who }));
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'등록 오류',
                            'warn_message':'로그인되어 있지 않아서, 게시글을 등록 할 수 없습니다.',
                            'return_url':'/' }));
       }

};

// 등록 양식에서 입력된 정보를 신규로 등록(DB에 저장)합니다.
const HanldleAddDoc = (req, res) => {  // 글 등록
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, y, m, d, regdate;
  let    docimage = '/images/uploads/documents/'; // 이미지 저장디렉터리
  let    picfile = req.file;
  let    userEmail=req.session.who;

       console.log(body);
       console.log(userEmail);

    if (req.session.auth) {
      if(picfile){
        docimage = docimage + picfile.filename;
        console.log("사진있음");
      }else {
        docimage = '';
        console.log("사진없음");
      }
      regdate = new Date();
      db.query('INSERT INTO document(docPass, userID, title, filePath, date) VALUES (?, ?, ?, ?, ?)',
            [body.docpw, userEmail, body.title, docimage, regdate], (error, results, fields) => {
        if (error) {
            htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                          'warn_title':'등록 오류',
                          'warn_message':'등록할때 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                          'return_url':'/' }));
        } else {
            console.log("등록에 성공하였으며, DB에 신규로 등록하였습니다.!");
            res.redirect('/storage/list');
        }
    });
   }         
  else {
      htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
      res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                        'warn_title':'등록 오류',
                        'warn_message':'로그인되어 있지 않아서, 등록 할 수 없습니다.',
                        'return_url':'/' }));
    }
};

// ---------------------------------------글 수정 기능---------------------------------------------
// 글 수정 양식을 브라우저로 출력합니다.
const PrintDocumentEdit = (req, res) => {
  let    body = req.body;
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  const query = url.parse(req.url, true).query;

       if (req.session.auth) { // 로그인된 경우에만 처리한다
        db.query('select userID from document where docID=?', query.index, (error,data)=>{
          if(error){res.status(562).end("PrintDocumentEdit: DB query is failed");}
          else if(data[0].userID==req.session.who){ // 작성자만 수정가능
            htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
            htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  // 메뉴
            htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/doc_edit.ejs','utf8'); // 메인화면
            htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

            sql_str = "SELECT docID, docPass, title, filePath, date from document where docID = ?"; // 글 검색 SQL

            res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

            db.query(sql_str, query.index, (error, results, fields) => {  // 글 검색 SQL실행
              if(error) {res.status(562).end("PrintDocumentEdit: DB query is failed");}
              else if (results.length <= 0) { // 조회된 글이 없다면, 오류메시지 출력
                htmlstream2 = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                res.status(562).end(ejs.render(htmlstream2, { 'title': 'Error',
                                    'warn_title':'조회 오류',
                                    'warn_message':'조회된 글이 없습니다.',
                                    'return_url':'/' }));
              }
              else{
                res.end(ejs.render(htmlstream,  { 'title' : 'Our Note',
                                                  'logurl': '/users/logout',
                                                  'loglabel': 'Logout',
                                                  'user': req.session.who,
                                                    docdata : results[0] }));  // 조회된 글 정보
              }
            });
          }
          else{
           htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
           res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                             'warn_title':'수정 오류',
                             'warn_message':'작성자만 수정 가능합니다.',
                             'return_url':'/storage/list' }));
          }
        });
       }
       else {
         htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                            'warn_title':'수정 오류',
                            'warn_message':'로그인되어 있지 않아서, 수정 할 수 없습니다.',
                            'return_url':'/' }));
       }

};

// 글 수정 양식에서 입력된 정보를 DB에 업데이트합니다.
const HanldleDocumentEdit = (req, res) => {  // 글 수정
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, delfile, pic;
  let    docimage = '/images/uploads/documents/'; // 이미지 저장디렉터리
  let    picfile = req.file;
  const query = url.parse(req.url, true).query;

        console.log(body);
        console.log(picfile);

      if (req.session.auth) {
        db.query('select userID from document where docID=?', query.index, (error,data)=>{
          if(error){res.status(562).end("HandleDocumentEdit: DB query is failed");}
          else if(data[0].userID==req.session.who){ // 작성자만 수정가능
            db.query('SELECT filePath from document where docID=?',query.index, (error, data) => {
              if (error) {res.status(562).end("HandleDocumentEdit: DB query is failed");}
              else if(data[0]==''){ //원래 이미지가 없는 경우-그냥 넣어주면됨
                docimage = docimage + picfile.filename;
                console.log(data);
                db.query('UPDATE document SET docPass=?, title=?, filePath=? where docID=?',
                      [body.docPass, body.title, docimage, query.index], (error, results, fields) => {
                  if (error) {
                      htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                      res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                                    'warn_title':'수정 오류',
                                    'warn_message':'수정할 때 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                    'return_url':'/' }));
                  } else {
                      console.log("수정에 성공하였습니다.!");
                      res.redirect('/storage/list');
                  }
              });

              }else{  //원래 이미지가 존재하는 경우
                pic=data[0].filePath;
                if(picfile){//이미지 변경 있음
                  docimage = docimage + picfile.filename;
                  delfile = pic;
                  console.log("사진변경있음");
                  console.log(delfile); // 삭제할 이미지
                  console.log(docimage);
                }else{  //이미지 변경 없음
                  docimage = pic; // 원래 있던 경로 넣어주기
                  console.log("사진변경없음");
                }

                db.query('UPDATE document SET docPass=?, title=?, filePath=? where docID=?',
                      [body.docPass, body.title, docimage, query.index], (error, results, fields) => {
                  if (error) {
                      htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                      res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                                    'warn_title':'수정 오류',
                                    'warn_message':'수정할 때 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                    'return_url':'/' }));
                  } else {
                      console.log("수정에 성공하였습니다.!");
                      if (picfile&&pic) {  //기존이미지와 변경되는 이미지가 모두 존재할 경우
                        fs.unlink(delfile, (error, result) => {
                          if(error) {console.error("error3");
                          console.log(delfile);
                        }
                          else console.log('파일이 삭제되었습니다.');  //기존이미지 삭제
                        });
                      }
                      res.redirect('/storage/list');
                  }
              });
              }
            });
          }
      else{
       htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
       res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                         'warn_title':'수정 오류',
                         'warn_message':'작성자만 수정 가능합니다.',
                         'return_url':'/storage/list' }));
      }
    });
    }
    else {
      htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
      res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                        'warn_title':'수정 오류',
                        'warn_message':'로그인되어 있지 않아서, 수정 할 수 없습니다.',
                        'return_url':'/' }));
    }
};

//  선택된 글을 DB에서 삭제합니다.
const HanldleDocumentDel = (req, res) => {  // 글 삭제
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, delfile;
  const query = url.parse(req.url, true).query;

       //delfile=body.pic;

       if (req.session.auth) {
         db.query('select userID from document where docID=?', query.index,(error,data)=>{
           console.log(data[0].userID);
           console.log(req.session.who);
           if(error){res.status(562).end("HandleDocumentDel: DB query is failed");}
           else if(data[0].userID==req.session.who){ // 작성자만 삭제가능
            db.query('DELETE FROM document where docID = ?',
                query.index, (error, results, fields) => {
            if (error) {
                htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
                res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                              'warn_title':'삭제 오류',
                              'warn_message':'삭제할때 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                              'return_url':'/' }));
            } else {
                console.log("삭제에 성공하였습니다.!");
                /*fs.unlink('delfile', (error) => {
                  if(error) console.error(error);
                  console.log('파일이 삭제되었습니다.');
                });*/
                res.redirect('/storage/list');
              }
            });
           }
           else{
            htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                              'warn_title':'삭제 오류',
                              'warn_message':'작성자만 삭제 가능합니다.',
                              'return_url':'/storage/list' }));
           }
         });
          
    }
    else {
        htmlstream = fs.readFileSync(__dirname + '/../views/error.ejs','utf8');
        res.status(562).end(ejs.render(htmlstream, { 'title': 'Error',
                          'warn_title':'삭제 오류',
                          'warn_message':'로그인되어 있지 않아서, 삭제 할 수 없습니다.',
                          'return_url':'/' }));
      }
};

// REST API의 URI와 핸들러를 매핑합니다.
router.get('/doc', PrintDocPWForm);  // 비밀번호 입력 화면을 출력처리
router.post('/document', PrintDocDetail);  // 글 상세내용을 출력처리

router.get('/form', PrintAddDocForm);   // 게시글 등록화면을 출력처리
router.post('/document/add', upload.single('file'), HanldleAddDoc); // 게시글 등록내용을 DB에 저장처리

router.get('/edit', PrintDocumentEdit);  // 게시글 변경화면을 출력처리
router.post('/document/edit', upload.single('file'), HanldleDocumentEdit); // 게시글 변경내용을 DB에 저장처리

router.get('/document/del', HanldleDocumentDel); // 상품삭제내용을 DB에 처리

router.get('/list', PrintDocList);      // 리스트를 화면에 출력

module.exports = router;
