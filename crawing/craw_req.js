import fs from 'fs';
const fetchData = async () => {
    const results = [];

    for (let page = 1; page <= 18; page++) {
        try {
            const response = await fetch(`https://api.era8.vn/v1/item?pageNumber=${page}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTIsInJvbGVJZCI6MiwidG9rZW5JZCI6IjNmYzBlZWM1LTI1YjUtNGJlNS04MWNiLTExNjQwZDYzYTY1OSIsInN0b3JlSWQiOjQzLCJ0eXBlIjoidXNlciIsImlhdCI6MTczMzg4OTI5MywiZXhwIjoxNzMzODkwMTkzfQ.T8mk25no-ln8VBjrl69qdjHgi9QYjsk9LwOEFl7DzlY', // Thay thế với token của bạn
                },
            });

            if (!response.ok) {
                console.error(`Error fetching page ${page}:`, response.status);
                console.log(await response.text());
                console.log('Status:', response.status);
                console.log('Headers:', response.headers);
                continue;
            }

            const responseData = await response.json();

            // Kiểm tra cấu trúc dữ liệu
            if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
                // Duyệt qua các item và lưu vào mảng results
                responseData.data.data.forEach((item, index) => {
                    console.log(`Item ${index + 1}:`, item);
                    results.push(item);  // Thêm item vào mảng results
                });
            } else {
                console.error('Không có dữ liệu hợp lệ.');
            }
        } catch (err) {
            console.error(`Error on page ${page}:`, err.message);
        }
    }

    // Sau khi cào xong, lưu dữ liệu vào file JSON
    if (results.length > 0) {
        const jsonData = JSON.stringify(results, null, 2);  // Chuyển mảng results thành chuỗi JSON
        fs.writeFile('items.json', jsonData, (err) => {  // Ghi vào file 'items.json'
            if (err) {
                console.error('Error writing to file:', err);
            } else {
                console.log('Dữ liệu đã được lưu vào file items.json');
            }
        });
    }
};

fetchData();
