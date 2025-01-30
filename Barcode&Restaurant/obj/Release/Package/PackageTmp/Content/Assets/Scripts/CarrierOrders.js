$(document).ready(function () {

    let customers = [];
    let orders = [];
    let cashPaid = 0;
    let cardPaid = 0;
    let totalCost = 0;
    let remainder = 0;

    try {
        $.ajax({
            url: '/Carriers/GetOrders',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                customers = response.Customers;
                orders = response.Orders;
                displayOrders();
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }

    

    // Siparişleri ekranda göster
    function displayOrders(filteredOrders = orders) {
        try {
            $('.ordersContainer .orders').empty();
            let orderHTML = '';

            filteredOrders.forEach(order => {
                let customer = customers.find(c => c.CustomerId == order.CustomerId);
                let orderItems = JSON.parse(order.Orders);
                let totalOrderCost = orderItems.reduce((acc, item) => acc + parseFloat(item.productPrice), 0);

                orderHTML += `
            <div class="order">
                <div class="customerInfo">
                    <input type="hidden" name="totalCost" value="${totalOrderCost.toFixed(2)}" />
                    <div id="totalCost"> <span>Toplam Tutar: </span> <label>${totalOrderCost.toFixed(2)}TL</label> </div>
                    <span id="name"> <span>Müşteri: </span> <label>${customer.NameSurname}</label> </span>
                    <span id="phone"> <span>Tel: </span> <label>${customer.PhoneNumber}</label> </span>
                    <span id="adress"> Adres: ${customer.Adress} </span>
                    <span id="adress"> Not: ${order.CustomerNote} </span>
                </div>
                <div id="hr"></div>
                <div class="orderBtns">
                    <button class="pay" data-order-id="${order.PacketOrderId}"> <i class="fa fa-credit-card" aria-hidden="true"></i> <span>ÖDE</span> </button>
                    <button class="detail" data-order-id="${order.PacketOrderId}"> <i class="fa fa-info-circle" aria-hidden="true"></i> <span>DETAY</span> </button>
                    <button class="return" data-order-id="${order.PacketOrderId}"><i class="fa fa-retweet" aria-hidden="true"></i> <span>İADE</span> </button>
                </div>
            </div>
            `;
            });

            $('.ordersContainer .orders').append(orderHTML);
        }
        catch (e) {
            console.error(e);
        }

       
    }

    // Ödeme modalini aç
    function openPayModal(packetOrderId) {

        try {
            cashPaid = 0;
            cardPaid = 0;
            $('.payModal input[name="cashPaid"]').val('');
            $('.payModal input[name="cardPaid"]').val('');
            $('.payModal .totalCost').text('');
            $('.payModal').css('display', 'flex');

            let findedOrder = orders.find(o => o.PacketOrderId == packetOrderId);
            let orderItems = JSON.parse(findedOrder.Orders);

            totalCost = orderItems.reduce((acc, item) => acc + parseFloat(item.productPrice), 0);

            remainder = parseFloat(totalCost.toFixed(2));


            $('.payModal .totalCost').text(`${totalCost.toFixed(2)}TL`);
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Nakit ödeme butonuna tıklama
    function handleCashPayment() {

        try {
            let cashInput = parseFloat($('.payModal input[name="cashPaid"]').val());

            let cash = isNaN(cashInput) ? 0 : cashInput;

            if (cash > 0 && (remainder - cash) >= 0) {
                cashPaid = parseFloat((cashPaid + cash).toFixed(2));
                remainder = parseFloat((remainder - cash).toFixed(2));
                updatePayModal();
            } else {
                showError('Geçersiz nakit miktarı girdiniz veya ödenen miktar toplamı aşıyor.');
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Kart ödeme butonuna tıklama
    function handleCardPayment() {
        try {
            let cardInput = parseFloat($('.payModal input[name="cardPaid"]').val());
            let card = isNaN(cardInput) ? 0 : cardInput;

            if (card > 0 && (remainder - card) >= 0) {
                cardPaid = parseFloat((cardPaid + card).toFixed(2));
                remainder = parseFloat((remainder - card).toFixed(2));
                updatePayModal();
            } else {
                showError('Geçersiz kart miktarı girdiniz veya ödenen miktar toplamı aşıyor.');
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Modal güncelleme
    function updatePayModal() {
        try {
            $('.payModal .totalCost').text(`${remainder.toFixed(2)}TL`);
            $('.payModal .totalCost').css('color', 'black');
            $('.payModal input[name="cashPaid"]').css('border-color', 'lightgray').css('color', 'black');
            $('.payModal input[name="cardPaid"]').css('border-color', 'lightgray').css('color', 'black');
        }
        catch (e) {
            console.error(e);
        }
       
    }

    // Hata mesajı gösterme
    function showError(message) {
        try {
            $('.payModal .totalCost').css('color', 'red');
        }
        catch (e) {
            console.error(e);
        }
       
       
    }

    // Sipariş ödeme işlemini yap
    function payOrder(packetOrderId) {
        try {
            if (remainder < 0.01) {
                let formData = new FormData();
                formData.append('packetOrderId', packetOrderId);
                formData.append('cashPaid', cashPaid);
                formData.append('cardPaid', cardPaid);

                $.ajax({
                    url: '/Carriers/PayOrder',
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        alert('Ödeme başarılı bir şekilde gerçekleşti.');
                        window.location.reload();
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }
                });
            } else {
                showError("Ödeme tamamlanamadı, kalan miktar ödenmemiş.");
            }
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Modal kapanış işlemi
    function closePayModal() {
        try {
            $('.payModal').css('display', 'none');
            $('.payModal .totalCost').text('');
            $('.payModal input[name="cashPaid"]').val('');
            $('.payModal input[name="cardPaid"]').val('');
            cashPaid = 0;
            cardPaid = 0;
            totalCost = 0;
            remainder = 0;
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Event listener'lar
    $('.ordersContainer .orders').on('click', '.pay', function () {
        try {
            let packetOrderId = $(this).data('order-id');
            openPayModal(packetOrderId);

            $('.payModal').on('input', 'input[name="cashPaid"]', function () {
                $(this).val($(this).val().replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'));
                let splitValue = $(this).val().split('.');
                if (splitValue[1] && splitValue[1].length > 2) {
                    $(this).val(splitValue[0] + '.' + splitValue[1].slice(0, 2));
                }
            });

            $('.payModal').on('input', 'input[name="cardPaid"]', function () {
                $(this).val($(this).val().replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'));
                let splitValue = $(this).val().split('.');
                if (splitValue[1] && splitValue[1].length > 2) {
                    $(this).val(splitValue[0] + '.' + splitValue[1].slice(0, 2));
                }
            });

            $('.payModal').on('click', '.takeCash', handleCashPayment);
            $('.payModal').on('click', '.takeCard', handleCardPayment);
            $('.payModal').on('click', '.pay-order', function () {
                payOrder(packetOrderId);
            });
            $('.payModal').on('click', '.close-icon', closePayModal);
        }
        catch (e) {
            console.error(e);
        }
       
    });

    $('.ordersContainer .orders').on('click', '.detail', function () {
        try {
            $('.detailModal .detailOrders').empty();
            let orderId = $(this).data('order-id');
            $('.detailModal').css('display', 'flex');

            let order = orders.find(o => o.PacketOrderId == orderId);
            let orderItems = JSON.parse(order.Orders);
            let totalOrderCost = orderItems.reduce((acc, item) => acc + parseFloat(item.productPrice), 0);

            let orderHTML = orderItems.map(item =>
                `<div class="order">
                <div>
                    <span>${item.productName}</span>
                    <label>${item.productPrice.toFixed(2)}TL</label>
                </div>
                <div>
                    <span>Not</span>
                    <label>${item.productNote}</label>
                </div>
            </div>`
            ).join('');

            $('.detailModal .title .totalCost').text(`${totalOrderCost.toFixed(2)}TL`);
            $('.detailModal .detailOrders').append(orderHTML);

            $('.detailModal').on('click', '.close-icon', function () {
                $('.detailModal').css('display', 'none');
                $('.detailModal .totalCost').text('');
            });
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('.ordersContainer .orders').on('click', '.return', function () {
        try {
            let orderId = $(this).data('order-id');
            if (confirm("İade işlemi gerçekleşsin mi?")) {
                $.ajax({
                    url: `/Carriers/GiveBackOrder/${orderId}`,
                    type: 'PUT',
                    success: function (response) {
                        alert('İade işlemi başarılı bir şekilde gerçekleşti.');
                        window.location.reload();
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }
                });
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });

    // Search customer input event
    $('input[name="searchCustomer"]').on('input', function () {
        try {
            let searchValue = $(this).val().toLowerCase();

            if (searchValue.trim() === '') {
                displayOrders();
            } else {
                let filteredOrders = orders.filter(order => {
                    let customer = customers.find(c => c.CustomerId == order.CustomerId);
                    return customer.NameSurname.toLowerCase().includes(searchValue) ||
                        customer.PhoneNumber.toLowerCase().includes(searchValue);
                });
                displayOrders(filteredOrders);
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });
});
