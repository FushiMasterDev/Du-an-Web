var currentuser; // user hiện tại, biến toàn cục
window.onload = function () {
    khoiTao();

	// autocomplete cho khung tim kiem
	autocomplete(document.getElementById('search-box'), list_products);

	// thêm tags (từ khóa) vào khung tìm kiếm
	var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
	for (var t of tags) addTags(t, "index.html?search=" + t)

	currentuser = getCurrentUser();
	addProductToTable(currentuser);
}

function addProductToTable(user) {
	var table = document.getElementsByClassName('listSanPham')[0];

	var s = `
		<tbody>
			<tr>
				<th>STT</th>
				<th>Sản phẩm</th>
				<th>Giá</th>
				<th>Số lượng</th>
				<th>Thành tiền</th>
				<th>Thời gian</th>
				<th>Xóa</th>
			</tr>`;

	if (!user) {
		s += `
			<tr>
				<td colspan="7"> 
					<h1 style="color:red; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">
						Bạn chưa đăng nhập !!
					</h1> 
				</td>
			</tr>
		`;
		table.innerHTML = s;
		return;
	} else if (user.products.length == 0) {
		s += `
			<tr>
				<td colspan="7"> 
					<h1 style="color:green; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">
						Giỏ hàng trống !!
					</h1> 
				</td>
			</tr>
		`;
		table.innerHTML = s;
		return;
	}

	var totalPrice = 0;
	for (var i = 0; i < user.products.length; i++) {
		var masp = user.products[i].ma;
		var soluongSp = user.products[i].soluong;
		var p = timKiemTheoMa(list_products, masp);
		var price = (p.promo.name == 'giareonline' ? p.promo.value : p.price);
		var thoigian = new Date(user.products[i].date).toLocaleString();
		var thanhtien = stringToNum(price) * soluongSp;

		s += `
			<tr>
				<td>` + (i + 1) + `</td>
				<td class="noPadding imgHide">
					<a target="_blank" href="chitietsanpham.html?` + p.name.split(' ').join('-') + `" title="Xem chi tiết">
						` + p.name + `
						<img src="` + p.img + `">
					</a>
				</td>
				<td class="alignRight">` + price + ` ₫</td>
				<td class="soluong" >
					<button onclick="giamSoLuong('` + masp + `')"><i class="fa fa-minus"></i></button>
					<input size="1" onchange="capNhatSoLuongFromInput(this, '` + masp + `')" value=` + soluongSp + `>
					<button onclick="tangSoLuong('` + masp + `')"><i class="fa fa-plus"></i></button>
				</td>
				<td class="alignRight">` + numToString(thanhtien) + ` ₫</td>
				<td style="text-align: center" >` + thoigian + `</td>
				<td class="noPadding"> <i class="fa fa-trash" onclick="xoaSanPhamTrongGioHang(` + i + `)"></i> </td>
			</tr>
		`;
		// Chú ý nháy cho đúng ở giamsoluong, tangsoluong
		totalPrice += thanhtien;
	}

	s += `
			<tr style="font-weight:bold; text-align:center">
				<td colspan="4">TỔNG TIỀN: </td>
				<td class="alignRight">` + numToString(totalPrice) + ` ₫</td>
				<td class="thanhtoan" onclick="thanhToan()"> Thanh Toán </td>
				<td class="xoaHet" onclick="xoaHet()"> Xóa hết </td>
			</tr>
		</tbody>
	`;

	table.innerHTML = s;
}

function xoaSanPhamTrongGioHang(i) {
	if (window.confirm('Xác nhận hủy mua')) {
		currentuser.products.splice(i, 1);
		capNhatMoiThu();
	}
}
function calculateTotal() {
    var totalPrice = 0;
    for (var i = 0; i < currentuser.products.length; i++) {
		var masp = currentuser.products[i].ma;
		var soluongSp = currentuser.products[i].soluong;
		var p = timKiemTheoMa(list_products, masp);
		var price = (p.promo.name == 'giareonline' ? p.promo.value : p.price);
		totalPrice += stringToNum(price) * soluongSp;
	}
    return totalPrice;
}


function thanhToan() {
	var c_user = getCurrentUser();
	if(c_user.off) {
        alert('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!');
        addAlertBox('Tài khoản của bạn đã bị khóa bởi Admin.', '#aa0000', '#fff', 10000);
        return;
	}
	
	if (!currentuser.products.length) {
		addAlertBox('Không có mặt hàng nào cần thanh toán !!', '#ffb400', '#fff', 2000);
		return;
	}

	// --- Bắt đầu tạo Modal bằng JS ---
    
    // 1. Tính tổng tiền
    var tongTien = calculateTotal();

    // 2. Tạo lớp phủ (overlay)
    var overlay = document.createElement('div');
    overlay.id = 'qr-payment-modal'; // Gán ID để có thể xóa đi
    // CSS cho overlay
    overlay.style.position = 'fixed';
    overlay.style.zIndex = '1000';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    // 3. Tạo nội dung modal (cái hộp trắng)
    var modalContent = document.createElement('div');
    // CSS cho hộp nội dung
    modalContent.style.backgroundColor = '#fefefe';
    modalContent.style.padding = '25px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '400px';
    modalContent.style.textAlign = 'center';
    modalContent.style.position = 'relative';
    modalContent.style.boxShadow = '0 4px 8px 0 rgba(0,0,0,0.2)';

    // 4. Tạo nút đóng (dấu X)
    var closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;'; // Ký tự 'x'
    closeBtn.onclick = dongModalQR; // Gán sự kiện click
    // CSS cho nút đóng
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '20px';
    closeBtn.style.fontSize = '28px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.color = '#aaa';
    closeBtn.style.cursor = 'pointer';

    // 5. Tạo tiêu đề
    var title = document.createElement('h3');
    title.innerText = 'Quét mã QR để thanh toán';
    title.style.marginTop = '0';

    // 6. Tạo ảnh QR
    var qrImg = document.createElement('img');
    qrImg.src = 'img/qrcode.png'; 
    qrImg.alt = 'Mã QR Thanh toán';
    // CSS cho ảnh QR
    qrImg.style.width = '250px';
    qrImg.style.height = '250px';
    qrImg.style.border = '1px solid #ddd'; // Thêm viền cho đẹp

    // 7. Tạo văn bản tổng tiền
    var priceText = document.createElement('p');
    priceText.style.fontWeight = 'bold';
    priceText.style.marginTop = '15px';
    priceText.style.fontSize = '18px';
    priceText.innerHTML = 'Tổng tiền: <span style="color: #d00;">' + numToString(tongTien) + ' ₫</span>';

    // 8. Tạo nút "Xác nhận đã thanh toán"
    var confirmBtn = document.createElement('button');
    confirmBtn.innerText = 'Tôi đã thanh toán';
    confirmBtn.onclick = xuLyThanhToanThanhCong; // Gán sự kiện click
    // CSS cho nút xác nhận
    confirmBtn.style.backgroundColor = '#4CAF50';
    confirmBtn.style.color = 'white';
    confirmBtn.style.padding = '12px 20px';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '5px';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.style.fontSize = '16px';
    confirmBtn.style.marginTop = '10px';

    // 9. Gắn các phần tử con vào hộp nội dung
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(qrImg);
    modalContent.appendChild(priceText);
    modalContent.appendChild(confirmBtn);

    // 10. Gắn hộp nội dung vào lớp phủ
    overlay.appendChild(modalContent);

    // 11. Gắn modal (lớp phủ) vào trang web
    document.body.appendChild(overlay);

}

//Dùng để đóng và xóa modal
function dongModalQR() {
    var modal = document.getElementById('qr-payment-modal');
    if (modal) {
        // Xóa modal khỏi document.body
        document.body.removeChild(modal);
    }
}

function xuLyThanhToanThanhCong() {
	// Xác nhận lại một lần nữa
	if (window.confirm('Bạn xác nhận đã hoàn tất thanh toán?')) {
		currentuser.donhang.push({
			"sp": currentuser.products,
			"ngaymua": new Date(),
			"tinhTrang": 'Đang chờ xử lý'
		});
		currentuser.products = [];
		capNhatMoiThu();
		addAlertBox('Các sản phẩm đã được gửi vào đơn hàng và chờ xử lý.', '#17c671', '#fff', 4000);

        // Sau khi xử lý xong, đóng modal
        dongModalQR();
	}
}


function xoaHet() {
	if (currentuser.products.length) {
		if (window.confirm('Bạn có chắc chắn muốn xóa hết sản phẩm trong giỏ !!')) {
			currentuser.products = [];
			capNhatMoiThu();
		}
	}
}

// Cập nhật số lượng lúc nhập số lượng vào input
function capNhatSoLuongFromInput(inp, masp) {
	var soLuongMoi = Number(inp.value);
	if (!soLuongMoi || soLuongMoi <= 0) soLuongMoi = 1;

	for (var p of currentuser.products) {
		if (p.ma == masp) {
			p.soluong = soLuongMoi;
		}
	}

	capNhatMoiThu();
}

function tangSoLuong(masp) {
	for (var p of currentuser.products) {
		if (p.ma == masp) {
			p.soluong++;
		}
	}

	capNhatMoiThu();
}

function giamSoLuong(masp) {
	for (var p of currentuser.products) {
		if (p.ma == masp) {
			if (p.soluong > 1) {
				p.soluong--;
			} else {
				return;
			}
		}
	}

	capNhatMoiThu();
}

function capNhatMoiThu() { // Mọi thứ
	animateCartNumber();

	// cập nhật danh sách sản phẩm trong localstorage
	setCurrentUser(currentuser);
	updateListUser(currentuser);

	// cập nhật danh sách sản phẩm ở table
	addProductToTable(currentuser);

	// Cập nhật trên header
	capNhat_ThongTin_CurrentUser();
}
