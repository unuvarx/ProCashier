﻿$(document).ready(function () {
    let tableOrders = [];
    let packetOrders = [];
    let carriers = [];
    let totalCost = 0;
    let totalCard = 0;
    let totalCash = 0;
    const itemsPerPage = 10; // Sayfa başına gösterilecek öğe sayısı
    let currentPageTable = 1;
    let currentPagePacket = 1;
    let selectedDate = null; // Seçilen tarih


    try {
        showPreloader('flex');
        $.ajax({
            url: '/Report/GetHistoricalReport',
            type: 'GET',
            dataType: 'json',
            success: function (response) {

                tableOrders = response.tableSales.reverse();
                packetOrders = response.packetOrders.reverse();
                carriers = response.carriers;
                calculateTableOrdersTotal();
                calculatePacketOrdersTotal();
                updateTablePagination();
                updatePacketPagination();
                showPreloader('none');
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }
    
    function formatDate(dateString) {
        try {
            // Unix timestamp değerini almak için parantezler arasındaki sayıyı al
            let timestamp = parseInt(dateString.match(/\d+/)[0], 10);

            // Unix timestamp'i JavaScript Date objesine çevir
            let date = new Date(timestamp);

            // Tarih ve saat bilgilerini al
            let day = date.getDate();
            let month = date.getMonth() + 1; // JavaScript'te ay 0'dan başlar, bu yüzden +1 ekliyoruz
            let year = date.getFullYear();
            let hours = date.getHours();
            let minutes = date.getMinutes();

            // İstenilen formatı oluştur
            let formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

            return formattedDate;
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Tarih seçimi değiştiğinde işlenecek olay
    $('#dateInput').on('change', function () {
        try {
            selectedDate = $(this).val(); // Seçilen tarihi güncelle
            currentPageTable = 1; // Tabloyu ilk sayfaya döndür
            currentPagePacket = 1; // Tabloyu ilk sayfaya döndür
            calculateTableOrdersTotal(); // Masa siparişlerini filtrele ve güncelle
            calculatePacketOrdersTotal(); // Paket siparişlerini filtrele ve güncelle
            updateTablePagination(); // Tablo pagination'ını güncelle
            updatePacketPagination(); // Tablo pagination'ını güncelle
        }
        catch (e) {
            console.error(e);
        }
        
    });

    // Masa siparişleri için tablo güncelleme fonksiyonu
    function calculateTableOrdersTotal() {
        try {
            $('.table-orders tbody').empty();
            let filteredOrders = tableOrders.filter(order => {
                // Sipariş tarihini al
                let orderDate = new Date(parseInt(order.OrderStartingDate.substr(6)));
                // Seçilen tarihin yıl, ay ve günü
                let selectedDateTime = new Date(selectedDate);
                // Sadece yıl, ay ve günü karşılaştır
                return selectedDate === null || (orderDate.getFullYear() === selectedDateTime.getFullYear() &&
                    orderDate.getMonth() === selectedDateTime.getMonth() &&
                    orderDate.getDate() === selectedDateTime.getDate());
            });

            let startIndex = (currentPageTable - 1) * itemsPerPage;
            let endIndex = startIndex + itemsPerPage;
            let currentOrders = filteredOrders.slice(startIndex, endIndex);

            // Reset totals
            totalCost = 0;
            totalCard = 0;
            totalCash = 0;

            currentOrders.forEach(function (order) {
                totalCost += (parseFloat(order.PaymentCard) + parseFloat(order.PaymentCash));
                totalCard += parseFloat(order.PaymentCard);
                totalCash += parseFloat(order.PaymentCash);
                let tableRow =
                    `<tr id="${(parseFloat(order.PaymentCard) + parseFloat(order.PaymentCash)) === 0 ? "cancelOrder" : ""}">
                    <td><a target="_blank" href="/Report/TableDetail/${order.HistoryId}"><i class="fa fa-sort-amount-desc" aria-hidden="true"></i></a></td>
                    <td>${formatDate(order.OrderStartingDate)}</td>
                    <td>${formatDate(order.OrderClosingDate)}</td>
                    <td>${parseFloat(order.PaymentCard).toFixed(2)}TL</td>
                    <td>${parseFloat(order.PaymentCash).toFixed(2)}TL</td>
                    <td>${parseFloat(order.PaymentDiscount).toFixed(2)}TL</td>
                    <td>${(parseFloat(order.PaymentCard) + parseFloat(order.PaymentCash)).toFixed(2)}TL</td>
                </tr>`;
                $('.table-orders tbody').append(tableRow);
            });

            // Update totals display
            updateTotalsDisplay();
        }
        catch (e) {
            console.error(e);
        }
       
    }

    // Paket siparişleri için tablo güncelleme fonksiyonu
    function calculatePacketOrdersTotal() {
        try {
            $('.packet-orders tbody').empty();
            let filteredOrders = packetOrders.filter(order => {
                // Sipariş tarihini al
                let orderDate = new Date(parseInt(order.OrderStartingDate.substr(6)));
                // Seçilen tarihin yıl, ay ve günü
                let selectedDateTime = new Date(selectedDate);
                // Sadece yıl, ay ve günü karşılaştır
                return selectedDate === null || (orderDate.getFullYear() === selectedDateTime.getFullYear() &&
                    orderDate.getMonth() === selectedDateTime.getMonth() &&
                    orderDate.getDate() === selectedDateTime.getDate());
            });

            let startIndex = (currentPagePacket - 1) * itemsPerPage;
            let endIndex = startIndex + itemsPerPage;
            let currentOrders = filteredOrders.slice(startIndex, endIndex);

            // Reset totals
            totalCost = 0;
            totalCard = 0;
            totalCash = 0;

            currentOrders.forEach(function (order) {
                totalCost += (parseFloat(order.CardPaid) + parseFloat(order.CashPaid));
                totalCard += parseFloat(order.CardPaid);
                totalCash += parseFloat(order.CashPaid);
                let carrierName = carriers.find(x => x.CarrierId == order.CarrierId)?.NameSurname || "Unknown Carrier";
                let tableRow =
                    `<tr id="${(parseFloat(order.CardPaid) + parseFloat(order.CashPaid)) === 0 ? "cancelOrder" : ""}">
                    <td><a target="_blank" href="/Report/PacketDetail/${order.PacketOrderId}"><i class="fa fa-sort-amount-desc" aria-hidden="true"></i></a></td>
                    <td>${carrierName}</td>
                    <td>${formatDate(order.OrderStartingDate)}</td>
                    <td>${formatDate(order.OrderStartingDate)}</td>
                    <td>${parseFloat(order.CardPaid).toFixed(2)}TL</td>
                    <td>${parseFloat(order.CashPaid).toFixed(2)}TL</td>
                    <td>${(parseFloat(order.CashPaid) + parseFloat(order.CardPaid)).toFixed(2)}TL</td>
                </tr>`;
                $('.packet-orders tbody').append(tableRow);
            });

            // Update totals display
            updateTotalsDisplay();
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Tablo pagination'ını güncelleme fonksiyonları
    function updateTablePagination() {
        try {
            $('.table-pagination .pagination').empty();
            let totalPages = Math.ceil(getFilteredTableOrders().length / itemsPerPage);
            let maxVisibleButtons = 7;
            let startPage = 1;
            let endPage = totalPages;

            if (totalPages > maxVisibleButtons) {
                if (currentPageTable <= Math.ceil(maxVisibleButtons / 2)) {
                    startPage = 1;
                    endPage = maxVisibleButtons;
                } else if (currentPageTable > totalPages - Math.floor(maxVisibleButtons / 2)) {
                    startPage = totalPages - maxVisibleButtons + 1;
                    endPage = totalPages;
                } else {
                    startPage = currentPageTable - Math.floor(maxVisibleButtons / 2);
                    endPage = startPage + maxVisibleButtons - 1;
                }
            }

            // Previous button
            $('.table-pagination .pagination').append(`<li class="page-item ${currentPageTable === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPageTable - 1}"> < </a></li>`);

            // Numbered buttons
            for (let i = startPage; i <= endPage; i++) {
                let activeClass = (i === currentPageTable) ? 'active' : '';
                $('.table-pagination .pagination').append(`<li class="page-item ${activeClass}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`);
            }

            // Next button
            $('.table-pagination .pagination').append(`<li class="page-item ${currentPageTable === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPageTable + 1}"> > </a></li>`);

            // Click event for pagination buttons
            $('.table-pagination .pagination .page-link').on('click', function (e) {
                e.preventDefault();
                let page = parseInt($(this).attr('data-page'));
                if (page !== currentPageTable) {
                    currentPageTable = page;
                    calculateTableOrdersTotal();
                    $('.table-pagination .pagination .page-item').removeClass('active');
                    $(this).parent().addClass('active');
                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Paket siparişleri için pagination güncelleme fonksiyonu
    function updatePacketPagination() {
        try {
            $('.packet-pagination .pagination').empty();
            let totalPages = Math.ceil(getFilteredPacketOrders().length / itemsPerPage);
            let maxVisibleButtons = 7;
            let startPage = 1;
            let endPage = totalPages;

            if (totalPages > maxVisibleButtons) {
                if (currentPagePacket <= Math.ceil(maxVisibleButtons / 2)) {
                    startPage = 1;
                    endPage = maxVisibleButtons;
                } else if (currentPagePacket > totalPages - Math.floor(maxVisibleButtons / 2)) {
                    startPage = totalPages - maxVisibleButtons + 1;
                    endPage = totalPages;
                } else {
                    startPage = currentPagePacket - Math.floor(maxVisibleButtons / 2);
                    endPage = startPage + maxVisibleButtons - 1;
                }
            }

            // Previous button
            $('.packet-pagination .pagination').append(`<li class="page-item ${currentPagePacket === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPagePacket - 1}"> < </a></li>`);

            // Numbered buttons
            for (let i = startPage; i <= endPage; i++) {
                let activeClass = (i === currentPagePacket) ? 'active' : '';
                $('.packet-pagination .pagination').append(`<li class="page-item ${activeClass}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`);
            }

            // Next button
            $('.packet-pagination .pagination').append(`<li class="page-item ${currentPagePacket === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPagePacket + 1}"> > </a></li>`);

            // Click event for pagination buttons
            $('.packet-pagination .pagination .page-link').on('click', function (e) {
                e.preventDefault();
                let page = parseInt($(this).attr('data-page'));
                if (page !== currentPagePacket) {
                    currentPagePacket = page;
                    calculatePacketOrdersTotal();
                    $('.packet-pagination .pagination .page-item').removeClass('active');
                    $(this).parent().addClass('active');
                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Yardımcı fonksiyon: Filtrelenmiş masa siparişlerini alma
    function getFilteredTableOrders() {
        try {
            return tableOrders.filter(order => {
                if (!selectedDate) return true; // Seçilen tarih yoksa hepsini göster
                let orderDate = new Date(parseInt(order.OrderStartingDate.substr(6)));
                let selectedDateTime = new Date(selectedDate);
                return orderDate.getFullYear() === selectedDateTime.getFullYear() &&
                    orderDate.getMonth() === selectedDateTime.getMonth() &&
                    orderDate.getDate() === selectedDateTime.getDate();
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Yardımcı fonksiyon: Filtrelenmiş paket siparişlerini alma
    function getFilteredPacketOrders() {
        try {
            return packetOrders.filter(order => {
                if (!selectedDate) return true; // Seçilen tarih yoksa hepsini göster
                let orderDate = new Date(parseInt(order.OrderStartingDate.substr(6)));
                let selectedDateTime = new Date(selectedDate);
                return orderDate.getFullYear() === selectedDateTime.getFullYear() &&
                    orderDate.getMonth() === selectedDateTime.getMonth() &&
                    orderDate.getDate() === selectedDateTime.getDate();
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Toplam maliyetleri ve ödemeleri güncelleme fonksiyonu
    function updateTotalsDisplay() {
        try {
            // Toplam maliyet ve ödeme göstergelerini güncelle
            $('.total-cost').text(totalCost.toFixed(2));
            $('.total-card').text(totalCard.toFixed(2));
            $('.total-cash').text(totalCash.toFixed(2));
        }
        catch (e) {
            console.error(e);
        }
       
    }

    try {
        $('.table-orders').show();
        $('.packet-orders').hide();
        $('#tableOrdersBtn').addClass('active');
        $('#packetOrdersBtn').removeClass('active');
        $('.table-pagination').css('display', 'flex');
        $('.packet-pagination').css('display', 'none');
    }
    catch (e) {
        console.error(e);
    }
    

    // Masa siparişleri butonu tıklama olayı
    $('#tableOrdersBtn').on('click', function () {
        try {
            $('.table-orders').show();
            $('.packet-orders').hide();
            $('#tableOrdersBtn').addClass('active');
            $('#packetOrdersBtn').removeClass('active');
            $('.table-pagination').css('display', 'flex');
            $('.packet-pagination').css('display', 'none');
            currentPageTable = 1; // Sayfayı sıfırla
            updateTablePagination(); // Pagination'ı güncelle
        }
        catch (e) {
            console.error(e);
        }
        
    });

    // Paket siparişleri butonu tıklama olayı
    $('#packetOrdersBtn').on('click', function () {
        try {
            $('.table-orders').hide();
            $('.packet-orders').show();
            $('#tableOrdersBtn').removeClass('active');
            $('#packetOrdersBtn').addClass('active');
            $('.table-pagination').css('display', 'none');
            $('.packet-pagination').css('display', 'flex');
            currentPagePacket = 1; // Sayfayı sıfırla
            updatePacketPagination(); // Pagination'ı güncelle
        }
        catch (e) {
            console.error(e);
        }
       
    });
    function showPreloader(display) {
        try {

            $('.preloader').css('display', display);

        }
        catch (e) {
            console.error(e);
        }
    }
});
