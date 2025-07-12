const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

// Phục vụ file front-end từ thư mục 'public'
app.use(express.static('public'));

// Tăng giới hạn dữ liệu JSON nhận được, vì ảnh base64 có thể lớn
app.use(express.json({ limit: '10mb' }));

// API endpoint để render ảnh
app.post('/render', async (req, res) => {
    console.log('Received a request to render poster...');

    let browser = null;
    try {
        const data = req.body;

        // Nội dung HTML của poster sẽ được tạo ra ở đây
        // Nó bao gồm cả Tailwind CSS và Google Fonts để đảm bảo ảnh trông giống hệt preview
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; }
                    .card { background-color: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 1rem; border: 1px solid rgba(255, 255, 255, 0.1); }
                    .fpt-orange-text { color: #fb923c; }
                    .fpt-teal-text { color: #2dd4bf; }
                </style>
            </head>
            <body class="bg-gray-900">
                <div id="poster-render" class="w-[1200px] h-[857px] bg-cover bg-center p-12 text-slate-200 flex flex-col" style="background-image: url('${data.bg_url}');">
                    <header class="flex justify-between items-start mb-4">
                        <img src="${data.logo_url}" alt="Logo" class="h-9">
                        <div class="text-right"><p class="text-sm text-slate-400">${data.department}</p></div>
                    </header>
                    <div class="text-center my-6 flex-grow">
                        <p class="font-bold text-3xl text-slate-100">${data.sub_title}</p>
                        <h1 class="text-5xl font-extrabold leading-tight text-white mt-2">${data.main_title}</h1>
                    </div>
                    <div class="grid grid-cols-3 gap-8 items-stretch">
                        <div class="col-span-2 space-y-8 flex flex-col">
                            <div class="card p-6">
                                <h2 class="font-bold text-xl text-slate-100 mb-4">Chi tiết chương trình</h2>
                                <div class="grid grid-cols-2 gap-6">
                                    <div><p class="text-sm text-slate-400">Thời gian</p><p class="font-bold text-lg">${data.training_time}</p><p class="font-semibold">${data.training_date}</p></div>
                                    <div><p class="text-sm text-slate-400">Hình thức</p><p class="font-bold text-lg">${data.training_format}</p><p class="font-semibold">${data.training_location}</p></div>
                                </div>
                            </div>
                            <div class="card p-6 flex-grow">
                                <h2 class="font-bold text-xl text-slate-100 mb-4">Nội dung chính</h2>
                                <div class="space-y-3 text-slate-300">${data.main_content}</div>
                            </div>
                        </div>
                        <div class="card col-span-1 p-6 flex flex-col items-center text-center">
                            <h2 class="font-bold text-xl text-slate-100 mb-4">Người đào tạo</h2>
                            <img src="${data.trainer_image_url}" class="w-40 h-40 rounded-full object-cover border-4 border-orange-500 my-4">
                            <h3 class="text-2xl font-bold text-white">${data.trainer_name}</h3>
                            <p class="bg-orange-500 text-white font-semibold px-3 py-1 rounded-full text-sm mt-2">${data.trainer_title}</p>
                            <div class="w-full border-t border-white/10 my-6"></div>
                            <p class="text-sm text-slate-400 italic flex-grow flex items-center">"${data.trainer_quote}"</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Khởi chạy trình duyệt ảo
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        
        // Set kích thước ảnh đầu ra
        await page.setViewport({ width: 1200, height: 857 });
        
        // Nạp nội dung HTML vào trang ảo và chờ cho mọi thứ (font, ảnh) tải xong
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Chụp ảnh màn hình của trang ảo
        const imageBuffer = await page.screenshot({ type: 'png' });
        
        // Gửi ảnh về cho người dùng
        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);

    } catch (error) {
        console.error('Error rendering poster:', error);
        res.status(500).send('Lỗi khi tạo ảnh poster. Vui lòng thử lại.');
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed.');
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});