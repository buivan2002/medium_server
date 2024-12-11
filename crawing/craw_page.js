import fs from 'fs';

const fetchData = async () => {
    const results = [];

    for (let page = 1; page <= 4; page++) {
        try {
            const response = await fetch(`https://api.era8.vn/v1/drug?pageNumber=${page}&itemType=4`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTIsInJvbGVJZCI6MiwidG9rZW5JZCI6Ijg2YmE1OTNkLWM1ZWYtNGFhYS04NzRlLTM0MWY3MzUxZDNjNCIsInN0b3JlSWQiOjQzLCJ0eXBlIjoidXNlciIsImlhdCI6MTczMzkwNDAwOCwiZXhwIjoxNzMzOTA0OTA4fQ.hm4vr1UA64XMkhcRs0feYpkOwlmyN0nCwnasNV7CLzM', // Thay thế với token của bạn
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
            responseData.data.drugs.forEach((item, index) => {
                results.push(item);  // Thêm item vào mảng results

            })
            } catch (err) {
            console.error(`Error on page ${page}:`, err.message);
        }
    }

        // Sau khi cào xong, lưu dữ liệu vào file JSON
        if (results.length > 0) {
            const jsonData = JSON.stringify(results, null, 2);  // Chuyển mảng results thành chuỗi JSON
            fs.writeFile('dungcuyte.json', jsonData, (err) => {  // Ghi vào file 'items.json'
                if (err) {
                    console.error('Error writing to file:', err);
                } else {
                    console.log('Dữ liệu đã được lưu vào file items.json');
                }
            });
        }
    };
    

    fetchData();