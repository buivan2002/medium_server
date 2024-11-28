import puppeteer from 'puppeteer';
import fs from 'fs';
import csvWriter from 'csv-write-stream';

(async () => {
    const browser = await puppeteer.launch({
        protocolTimeout: 3600000 // 1 giờ (3600000 milliseconds)
    });
    const page = await browser.newPage();

    // Truy cập URL
    await page.goto('https://nghidinh15.vfa.gov.vn/Tracuu', { waitUntil: 'domcontentloaded' });

    // Mảng chứa dữ liệu tạm thời sẽ được ghi vào CSV
    const cardTitles = [];
    const cardTextBold = [];
    const receptionNumbers = [];

    let currentPage = 1;  // Lưu số trang hiện tại
    let hasNextPage = true;  // Biến kiểm tra có còn trang tiếp theo không

    // Tạo writer và pipe vào file CSV
    const writer = csvWriter();
    writer.pipe(fs.createWriteStream('products.csv'));  // Mở file 'products.csv' để ghi

    // Ghi header vào file CSV
    writer.write({ productName: 'Tên sản phẩm', companyName: 'Tên công ty', receptionNumber: 'Số tiếp nhận' });

    // Lặp qua các trang
    while (hasNextPage) {
        console.log(`Đang thu thập dữ liệu từ trang ${currentPage}...`);

        // Chờ phần tử cần thiết xuất hiện trên trang hiện tại
        await page.waitForSelector('.card-title.ng-binding');

        // Lấy nội dung từ các phần tử khớp với selector
        const items = await page.evaluate(() => {
            const cardTitles = [];
            const cardTextBold = [];
            const receptionNumbers = [];
        
            // Lấy các phần tử tương ứng và đẩy vào các mảng riêng biệt
            const cardTitlesElements = document.querySelectorAll('.card-title.ng-binding');
            const cardTextBoldElements = document.querySelectorAll('.card-text.font-weight-bold.ng-binding');
            const cardTextElements = document.querySelectorAll('.card-text.ng-binding');
        
            // Đẩy các phần tử .card-title.ng-binding vào mảng cardTitles
            cardTitlesElements.forEach(el => cardTitles.push(el.innerText.trim()));
        
            // Đẩy các phần tử .card-text.font-weight-bold.ng-binding vào mảng cardTextBold
            cardTextBoldElements.forEach(el => cardTextBold.push(el.innerText.trim()));
        
            // Lọc ra số tiếp nhận từ .card-text.ng-binding và đẩy vào mảng receptionNumbers
            cardTextElements.forEach((card) => {
                const text = card.innerText.trim();
                
                // Kiểm tra xem phần tử có chứa thông tin "Số tiếp nhận:" không
                if (text.includes('Số tiếp nhận:')) {
                    // Lọc ra chỉ phần "Số tiếp nhận:" và thêm vào mảng receptionNumbers
                    const receptionNumber = text.replace('Số tiếp nhận:', '').trim();
                    receptionNumbers.push(receptionNumber);
                }
            });
        
            // Trả về các mảng riêng biệt
            return { cardTitles, cardTextBold, receptionNumbers };
        });

        // In ra dữ liệu thu thập được từ trang hiện tại
        // console.log('Dữ liệu trang hiện tại:', items);

        // Lặp qua các mảng và ghi vào file CSV khi có dữ liệu
        const maxLength = Math.max(items.cardTitles.length, items.cardTextBold.length, items.receptionNumbers.length);
        
        // Kiểm tra xem tất cả mảng có cùng số lượng phần tử hay không
        for (let i = 0; i < maxLength; i++) {
            // Nếu có đủ dữ liệu từ các mảng
            const productName = items.cardTitles[i] || '';
            const companyName = items.cardTextBold[i] || '';
            const receptionNumber = items.receptionNumbers[i] || '';

            // Ghi dữ liệu vào file CSV dưới dạng đối tượng
            writer.write({ productName, companyName, receptionNumber });
        }

        // Kiểm tra có còn trang tiếp theo không
        hasNextPage = await page.evaluate(() => {
            const nextButton = document.querySelector('a.page-link[ng-click="setCurrent(pagination.current + 1)"]');
            return nextButton && !nextButton.closest('li').classList.contains('disabled');
        });

        // Nếu có trang tiếp theo, nhấn vào nút "Next"
        if (hasNextPage) {
            currentPage++;
            await page.click('a.page-link[ng-click="setCurrent(pagination.current + 1)"]');
            await new Promise(resolve => setTimeout(resolve, 500)); // Chờ 500ms
        } else {
            console.log("Không còn trang tiếp theo (nút Next bị vô hiệu hóa).");
        }
    }

    // Kết thúc ghi vào file CSV
    writer.end();
    console.log('Tất cả dữ liệu đã được lưu vào tệp CSV.');

    // Đóng trình duyệt
    await browser.close();
})();
