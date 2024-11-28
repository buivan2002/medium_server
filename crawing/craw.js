import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        protocolTimeout: 3600000 // 1 giờ (3600000 milliseconds)
      });
          const page = await browser.newPage();

    // Truy cập URL
    await page.goto('https://nghidinh15.vfa.gov.vn/Tracuu', { waitUntil: 'domcontentloaded' });

    const allItems = [];
    let currentPage = 1;  // Lưu số trang hiện tại
    let hasNextPage = true;  // Biến kiểm tra có còn trang tiếp theo không

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
        console.log('Dữ liệu trang hiện tại:', items);

        // Kiểm tra nếu dữ liệu trang hiện tại có khác với dữ liệu của các trang trước đó
        if (items.length > 0) {
            allItems.push(...items);  // Gộp dữ liệu từ trang hiện tại vào danh sách tổng
        }

        // Kiểm tra có còn trang tiếp theo không
        hasNextPage = await page.evaluate(() => {
            const nextButton = document.querySelector('a.page-link[ng-click="setCurrent(pagination.current + 1)"]');
            return nextButton && !nextButton.closest('li').classList.contains('disabled'); // Kiểm tra trong phần tử cha của nút Next
        });
        
        

        // Nếu có trang tiếp theo, nhấn vào nút "Next"
        if (hasNextPage) {
            currentPage++;
            await page.click('a.page-link[ng-click="setCurrent(pagination.current + 1)"]');

            await new Promise(resolve => setTimeout(resolve, 500)); // Chờ 3 giây
        } else {
            console.log("Không còn trang tiếp theo (nút Next bị vô hiệu hóa).");
        }
    }

    // In ra tất cả dữ liệu đã thu thập
    console.log('Tất cả dữ liệu từ các trang:', allItems);

    // Đóng trình duyệt
    await browser.close();
})();
