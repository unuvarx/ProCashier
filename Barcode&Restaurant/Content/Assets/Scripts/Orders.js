$(document).ready(function () {
    var navbarHeight = $(".navbar").height();
    var windowHeight = $(window).height();
    $(".ordersContainer").css("height", windowHeight - (navbarHeight + 16));

    let waitingOrders = [];
    let deliveryOrders = [];
    let customers = [];
    let carriers = [];

    try {
        $.ajax({
            url: '/PacketOrder/GetPacketOrders',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                waitingOrders = response.WaitingOrders;
                deliveryOrders = response.DeliveryOrders;
                customers = response.Customers;
                carriers = response.Carriers;



                // Verileri aldıktan sonra fonksiyonları çağırıyoruz
                displayWaitings();
                displayDeliveries();
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }

    

    // Bekleyen siparişleri gösteren fonksiyon
    function displayWaitings() {
        try {
            const orders = $('.waitingOrders .orders');
            orders.empty();

            waitingOrders.forEach(order => {
                let customer = customers.find(c => c.CustomerId === order.CustomerId);
                let carrier = carriers.find(c => c.CarrierId === order.CarrierId);
                let startDate = new Date(parseInt(order.OrderStartingDate.substr(6))); // Parse the date from "/Date(1720863007533)/"
                let now = new Date();
                let timeDiff = now - startDate; // Difference in milliseconds

                let seconds = Math.floor((timeDiff / 1000) % 60);
                let minutes = Math.floor((timeDiff / 1000 / 60) % 60);
                let hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);

                let orderHTML = `
                <div class="order">
                    <div class="orderTitle">
                        <label>Müşteri: <span>${customer.NameSurname}</span></label>
                        <label>Kurye: <span>${carrier.NameSurname}</span></label>
                    </div>
                    <div class="orderDate">
                        <span class="timeElapsed-${order.PacketOrderId}">${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</span>
                    </div>
                    <div class="orderBtns">
                        <button class="motoBtn" data-order-id="${order.PacketOrderId}">
                            <i class="fa fa-motorcycle" aria-hidden="true"></i>
                        </button>
                        <button class="editOrderBtn" data-order-id="${order.PacketOrderId}">
                            <i class="fa fa-pencil" aria-hidden="true"></i>
                        </button>
                        <button class="printBtn" data-packet-order-id="${order.PacketOrderId}">
                            <i class="fa fa-print" aria-hidden="true"></i>
                        </button>
                        <button class="infoBtn" data-order-id="${order.PacketOrderId}">
                            <i class="fa fa-info-circle" aria-hidden="true"></i>
                        </button>
                         <button class="cancelBtn" data-order-id="${order.PacketOrderId}">
                            <i class="fa fa-ban" aria-hidden="true"></i>
                        </button>
                        

                    </div>
                </div>
            `;

                orders.append(orderHTML);

                // Anlık geçen süreyi güncellemek için zamanlayıcı
                setInterval(() => {
                    updateElapsedTime(startDate, order.PacketOrderId);
                }, 1000);
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Teslimat siparişlerini gösteren fonksiyon
    function displayDeliveries() {
        try {
            const orders = $('.deliveryOrders .orders');
            orders.empty();

            deliveryOrders.forEach(order => {
                let customer = customers.find(c => c.CustomerId === order.CustomerId);
                let carrier = carriers.find(c => c.CarrierId === order.CarrierId);
                let startDate = new Date(parseInt(order.OrderStartingDate.substr(6))); // Parse the date from "/Date(1720863007533)/"
                let now = new Date();
                let timeDiff = now - startDate; // Difference in milliseconds

                let seconds = Math.floor((timeDiff / 1000) % 60);
                let minutes = Math.floor((timeDiff / 1000 / 60) % 60);
                let hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);

                let orderHTML = `
                <div class="order">
                    <div class="orderTitle">
                        <label>Müşteri: <span>${customer.NameSurname}</span></label>
                        <label>Kurye: <span>${carrier.NameSurname}</span></label>
                    </div>
                    <div class="orderDate">
                        <span class="timeElapsed-${order.PacketOrderId}">${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</span>
                    </div>
                    <div class="orderBtns">
                        <button class="printBtn" data-packet-order-id="${order.PacketOrderId}">
                            <i class="fa fa-print" aria-hidden="true"></i>
                        </button>
                        <button class="infoBtn" data-order-id="${order.PacketOrderId}">
                            <i class="fa fa-info-circle" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            `;

                orders.append(orderHTML);

                // Anlık geçen süreyi güncellemek için zamanlayıcı
                setInterval(() => {
                    updateElapsedTime(startDate, order.PacketOrderId);
                }, 1000);
            });
        }
        catch (e) {
            console.error(e);
        }

        
    }

    // Siparişlerin başlangıç zamanına göre geçen süreyi güncelleyen fonksiyon
    function updateElapsedTime(startDate, orderId) {
        try {
            let now = new Date();
            let timeDiff = now - startDate;

            let seconds = Math.floor((timeDiff / 1000) % 60);
            let minutes = Math.floor((timeDiff / 1000 / 60) % 60);
            let hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);

            // Güncellenen zamanı ilgili sipariş elementine yazdır
            $(`.timeElapsed-${orderId}`).text(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
        catch (e) {
            console.error(e);
        }
        
    }

   
    $('.waitingOrders .orders').on('click', '.motoBtn', function () {
        try {
            let packetOrderId = $(this).data('order-id');
            $.ajax({
                url: `/PacketOrder/SendCarrierPacketOrder/${packetOrderId}`,
                type: 'PUT',
                processData: false,
                contentType: false,
                success: function (response) {
                    // Belirtilen packetOrderId'ye sahip siparişi bul
                    let foundIndex = waitingOrders.findIndex(order => order.PacketOrderId === packetOrderId);
                    if (foundIndex !== -1) {
                        let foundOrder = waitingOrders[foundIndex];
                        // waitingOrders dizisinden çıkar ve deliveryOrders dizisine ekle
                        waitingOrders = waitingOrders.filter(order => order.PacketOrderId !== packetOrderId);
                        deliveryOrders.push(foundOrder);
                        // Bekleyen ve teslimat siparişlerini yeniden göster
                        displayWaitings();
                        displayDeliveries();
                    }
                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
        }
        catch (e) {
            console.error(e);
        }

        
    });
    $('.waitingOrders .orders').on('click', '.editOrderBtn', function () {
        try {
            let packetOrderId = $(this).data('order-id');
            window.location.href = `/PacketOrder/TakePacketOrder/${packetOrderId}`;
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('.ordersContainer .orders').on('click', '.infoBtn', function () {
        try {
            $('.infoModal .modalOrders').empty();
            let packetOrderId = $(this).data('order-id');
            $('.infoModal').css('display', 'flex');
            let arr = waitingOrders.concat(deliveryOrders);

            let order = arr.find(o => o.PacketOrderId === packetOrderId);

            let orders = JSON.parse(order.Orders);
            let customer = customers.find(c => c.CustomerId === order.CustomerId);
            let orderHTML = ``;
            let totalCost = 0;
            orders.forEach(o => {
                totalCost += o.productPrice;
                orderHTML += `
                <div class="order">
                        <div>
                            <span>${o.productName}</span>
                            <label>${o.productPrice.toFixed(2)}TL</label>
                        </div>
                        
                        <div>
                            <span>Not</span>
                            <label> ${o.productNote}</label>
                        </div>
                 </div>

            `
            });
            $('.infoModal .modalTitle #totalCost').text(`${totalCost}TL`)
            $('.infoModal .customerInfo #nameSurname').text(customer.NameSurname);
            $('.infoModal .customerInfo #phoneNumber').text(customer.PhoneNumber);
            $('.infoModal .customerInfo #adress').text(customer.Adress);
            $('.infoModal .customerNoteTitle .customerNote ').text(order.CustomerNote);
            $('.infoModal .modalOrders').append(orderHTML);
            $('.close-icon').on('click', function () {
                $('.infoModal').css('display', 'none');
            })
        }
        catch (e) {
            console.error(e);
        }

       
    });


    $('.orders').on('click', '.printBtn', function () {
        try {
            let packetOrderId = $(this).data('packet-order-id');
            let allPacketOrders = waitingOrders.concat(deliveryOrders);
            let findedOrder = allPacketOrders.find(o => o.PacketOrderId === packetOrderId);
            let formData2 = new FormData();



            let additionOrders = JSON.parse(findedOrder.Orders);
            let newAddition = [];
            let totalCost = 0;
            additionOrders.map(x => {
                totalCost = (parseFloat(x.productPrice) + parseFloat(totalCost)).toFixed(2);
                let finded = newAddition.find((item) => item.productId === x.productId && item.productNote.length === 0);

                if (finded && x.productNote.length === 0 && finded.productNote.length === 0) {
                    finded.quantity += 1;
                }
                else {
                    newAddition.push({
                        productId: x.productId,
                        productName: x.productName,
                        productNote: x.productNote,
                        productPrice: parseFloat(x.productPrice).toFixed(2),
                        quantity: 1,
                    });
                }
            })
            formData2.append('CustomerId', findedOrder.CustomerId);
            formData2.append('CarrierId', findedOrder.CarrierId);
            formData2.append('Orders', JSON.stringify(newAddition));
            formData2.append('TotalCost', parseFloat(totalCost).toFixed(2));
            formData2.append('CustomerNote', findedOrder.CustomerNote);

            // print request here
            let orderDateMatch = findedOrder.OrderStartingDate.match(/\/Date\((\d+)\)\//);
            if (orderDateMatch) {
                let orderDateMilliseconds = parseInt(orderDateMatch[1], 10);
                var orderDate = new Date(orderDateMilliseconds);
                if (isNaN(orderDate.getTime())) {
                    
                    return;
                }
            } else {
  
                return;
            }



            let customer = customers.find(c => c.CustomerId === findedOrder.CustomerId);
            let carrier = carriers.find(c => c.CarrierId === findedOrder.CarrierId);

            let responseUserName = $('input[name="UserName"]').val();
            let responseOrderDate = orderDate.toISOString();
            let responseOrders = newAddition;
            let responseTotalCost = parseFloat(totalCost).toFixed(2);
            let responseCustomerNameSurname = customer.NameSurname;
            let responseCustomerPhoneNumber = customer.PhoneNumber;
            let responseCustomerAdress = customer.Adress;
            let responseCustomerNote = findedOrder.CustomerNote;
            let responseCarrierNameSurname = carrier.NameSurname;
            let orderDATA = {
                UserName: responseUserName,
                OrderDate: responseOrderDate,
                Orders: responseOrders,
                TotalCost: responseTotalCost,
                CustomerNameSurname: responseCustomerNameSurname,
                CustomerPhoneNumber: responseCustomerPhoneNumber,
                CustomerAdress: responseCustomerAdress,
                CustomerNote: responseCustomerNote,
                CarrierNameSurname: responseCarrierNameSurname
            }

            fetch('http://localhost:8081/printpacketorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderDATA),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.text(); // JSON yanıtı için response.json() kullanabilirsiniz
                })
                .then(data => {
                   
                    
                })
                .catch(error => {
                    console.error('Error:', error);
                });

        }
        catch (e) {
            console.error(e);
        };
    })
    $('.waitingOrders .orders').on('click', '.cancelBtn', function () {

        try {
            let packetOrderId = $(this).data('order-id');

            let finded = waitingOrders.find(o => o.PacketOrderId === packetOrderId);
           
            if (confirm("Siparişi iptal etmek istediğinize emin misiniz?")) {
                $.ajax({
                    url: `/PacketOrder/CancelOrder/${finded.PacketOrderId}`,
                    type: 'PUT',
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        window.location.reload();
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }

                })
            }



        }
        catch (e) {
            console.error(e);
        }
    })
});
