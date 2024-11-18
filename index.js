const express = require('express');
const multer = require('multer');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

// Thiết lập kết nối PostgreSQL
const { Client } = require('pg');
// Database connection configuration
const dbConfig = {
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'Test',
};

// Create a new PostgreSQL client
const client = new Client(dbConfig);

// Connect to the database


let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
}, 
filename: (req, file, cb) => {
  cb(null, file.fieldname +  "-" + Date.now() + path.extname(file.originalname))
}
})

app.get('/', (req,res)=>{
  res.sendFile(__dirname + "/index.html")
})
let upload = multer({
  storage: storage
})

// API tải file Excel và thêm vào PostgreSQL
app.post('/import_csv', upload.single('file'), (req, res) => {
  console.log(req.file.path)
  const filePath = req.file.path
 if (path.extname(req.file.originalname) == '.xlsx') {
  try {
    const workbook = XLSX.readFile(filePath);  // Đọc file Excel
    const sheetName = workbook.SheetNames[0];  // Lấy tên sheet đầu tiên
    const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);  // Chuyển đổi sang CSV

    // Tạo đường dẫn file CSV
    const csvFilePath = filePath.replace('.xlsx', '.csv');
    fs.writeFileSync(csvFilePath, csvData ,(err) => {
      if (err) {
        console.error('Lỗi khi ghi file CSV:', err);
        res.status(500).send('Lỗi khi chuyển đổi file.');
        return;
      }});  
      // Ghi dữ liệu CSV vào file
   

      console.log(`File CSV đã được tạo thành công: ${csvFilePath}`);

      // Xóa file .xlsx chỉ sau khi ghi thành công file .csv
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Lỗi khi xóa file .xlsx:', unlinkErr);
        } else {
          console.log(`Đã xóa file .xlsx: ${filePath}`);
        }
      });
    // Gửi phản hồi thành công
    res.send(`File đã được chuyển đổi thành công thành: ${csvFilePath}`);
    uploadcsv(__dirname + '/' + csvFilePath)
  } catch (err) {
    console.error('Lỗi khi chuyển đổi file Excel:', err);
    res.status(500).send('Lỗi khi chuyển đổi file.');
  }
}
if (path.extname(req.file.originalname) == '.csv') {
  uploadcsv(__dirname + '/uploads/' + filePath)

}
});



function uploadcsv(path){
   let stream = fs.createReadStream(path);
   let csvDatColl = []
   let fileStream = csv
   .parse()
   .on ('data', function(csvrow) {
   csvDatColl.push(csvrow)
   })
   .on ('end', function() {
    csvDatColl.shift()
    client.connect()
    .then(() => {
      client.query('SELECT * FROM "medium_test"', (err, result) => {
        if (err) {
          console.log('Error fetching data:', err);
        } else {
          console.log('Data fetched from "medium_test":', result.rows);
        }
      });
      let query = 'INSERT INTO "medium_test" ("Tên khách hàng", "Tên công ty", "Chức vụ", "Số điện thoại", "Email") VALUES ';

      // Tạo các tham số cho câu lệnh SQL
      const valuePlaceholders = csvDatColl.map((_, index) => 
        `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
      ).join(', ');
      
      // Cập nhật câu lệnh SQL
      query += valuePlaceholders;
      
      // Truyền giá trị từ mảng csvDatColl
      const values = csvDatColl.flat();      
      client.query(query, values, (err, result) => {
        if (err) {
      console.error('Error executing query', err);
      } else {
      console.log('Query result:', result.rows);
      }
      })})
      .catch((err) => {
      console.error('Error connecting to PostgreSQL database', err);
      });
   })
   stream.pipe(fileStream)
}
// Chạy server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});