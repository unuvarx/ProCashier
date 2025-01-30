$(document).ready(function () {
    let Tables = [];
    let TableCategories = [];
    let activeCategorieId;
    let Waiters = [];
    let interval;
    let Notifications = [];

    try {
        $.ajax({
            url: '/Reckoning/GetTableCategories',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                try {
                    TableCategories = response;
                    activeCategorieId = response[0]?.TableCategorieId;
                    
                    showTableCategories(TableCategories);
                    $.ajax({
                        url: '/Reckoning/GetTables',
                        type: 'GET',
                        dataType: 'json',
                        success: function (response) {
                            Notifications = response.Notifications.reverse();
                            Waiters = response.Waiters;
                            Tables = response.tables.sort((a, b) => numericCompare(a.TableName.toLowerCase(), b.TableName.toLowerCase()));
                            ShowTable(Tables, activeCategorieId);
                            startTimer();
                            showNotifications(Notifications, Waiters);

                        },
                        error: function (xhr, status, error) {
                            console.error(error);
                        }
                    });
                }
                catch (err) {
                    console.error(err);
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

    };
    function showNotifications(notifications, waiters) {
        if (notifications.length > 0) {
            $('.notifications').css('display', 'flex');
            $('.notifications .notificationNumber').text(notifications.length);
            $('.NotificationModal .content').empty();
            let contentHTML = ``;
            notifications.forEach((item) => {
                let waiterName = waiters.find(x => x.WaiterId === item.WaiterId).NameSurname;
                contentHTML += `
               <div class="notificationContainer">
                  <div class="nameAndTableName">
                     <span id="waitername">
                        ${waiterName}
                     </span>
                     <span id="tablename">
                        ${item.TableName}
                     </span>
                     <span id="orderdate">
                        ${formatDate(item.OrderDate)}
                     </span>
                  </div>
                  <div class="notificationBtns">
                    <button data-notification-id="${item.NotificationId}" class="printInvoice">
                      Fişi Yazdır
                    </button>
                    <button data-notification-id="${item.NotificationId}" class="deleteInvoice">
                        Sil
                    </button>
                  </div>
                </div>
            `;

            })
            $('.NotificationModal .content').append(contentHTML);


        }
        else {
            $('.notifications').css('display', 'none');
        }
        
       
        
    }
    function showTableCategories(tableCategories) {
        try {
            $('.tableCategories').empty();

            let spanHtml = ``;
            tableCategories.forEach((category, index) => {
              
                spanHtml += `
                <button class="${index === 0 ? "active" : ""}" id="tableCategorieBtn" data-table-category-id="${category.TableCategorieId}"> ${category.TableCategorieName} </button>
            `;
            });

            $('.tableCategories').append(spanHtml);
        }
        catch (e) {
            console.error(e);
        }
        
    }

    $('.tableCategories').on('click', '#tableCategorieBtn', function () {
        try {
            let tableCategorieId = $(this).data('table-category-id');

            activeCategorieId = tableCategorieId;
            $('.tableCategories #tableCategorieBtn').removeClass('active');

            $(this).addClass('active');
            ShowTable(Tables, activeCategorieId);
        }
        catch (e) {
            console.error(e);
        }

        

    });
    function startTimer() {
        try {
            interval = setInterval(function () {
                updateTableTimes();
            }, 1000); // Her saniye güncelle
        }
        catch (e) {
            console.error(e);
        }
        
    }

    
    function updateTableTimes() {
        try {
            $(".tables.activeTable").each(function () {
                var tableId = $(this).find('input[name="table-id"]').val();
                var table = Tables.find(x => x.TableId == tableId);
                if (table && table.Status === 1) {
                    var orderDate = parseJsonDateString(table.OrderDate);
                    var now = new Date();
                    var elapsed = now - orderDate; // Geçen süreyi milisaniye olarak hesapla

                    var seconds = Math.floor((elapsed / 1000) % 60);
                    var minutes = Math.floor((elapsed / (1000 * 60)) % 60);
                    var hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);

                    // Süreyi saat:dakika:saniye formatında oluştur
                    var timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

                    // Tablo fiyatına sürenin üstüne ekle
                    $(this).find('.tableTime').html(`
                   
                    <span>${timeString}</span>
                `);
                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    function pad(num) {
        return num < 10 ? '0' + num : num;
    }

    function parseJsonDateString(jsonDate) {
        try {
            var regex = /^\/Date\((-?\d+)(\+|-)?(\d+)?\)\/$/;
            var matches = regex.exec(jsonDate);
            if (matches) {
                var milliseconds = parseInt(matches[1]);
                return new Date(milliseconds);
            }
            return null;

        }
        catch (e) {
            console.error(e);
        }
        
    }
    $(document).on('input', 'input[name="payInput"]', function () {
        try {
            let value = $(this).val();

            $(this).val(value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.?\d{0,2}).*/, '$1'));


            if (parseFloat(value) > 0) {
                $('.pay-btn .payTypeTitle').css('background-color', 'red');
                $('.pay-btn .payTypeTitle').css('color', '#fff');
                let title = `Ödeme Türünü Seçin <i class="fa fa-arrow-down" aria-hidden="true"></i>
                `;
                $('.pay-btn .payTypeTitle').html(title);
            } else {
                $('.pay-btn .payTypeTitle').css('background-color', 'white');
                $('.pay-btn .payTypeTitle').css('color', 'black');
                $('.pay-btn .payTypeTitle').text('Ödeme Türleri');
            }
        }
        catch (e) {
            console.error(e);
        }
        


    });

    $(document).on('click', '.tables button.GoTableDetail', function () {
        try {
            var tableId = $(this).data('tableid');
            window.location.href = `/Reckoning/TableDetail/${tableId}`;
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $(document).on('click', '.tables button.GoTableDetail .fa-bars', function (e) {
        try {
            e.stopPropagation(); // Buton tıklama olayını engellemek için

            var tableName = $('input[name="table-name"]', $(this).closest('.tables')).val();
            var tableId = parseInt($('input[name="table-id"]', $(this).closest('.tables')).val());

            // Table menu container göster
            $('.tableMenuContainer').css("display", "flex");
            $('.tableMenuContainer .title .tableName').text(tableName); // .text() kullanarak içeriği değiştir

            // Input alanını bul ve varsa kaldır
            $('.tableMenuContainer .content input[name="table-id-input"]').remove();
            $('.tableMenuContainer .content input[name="table-name-input"]').remove();

            // Yeni input alanını oluştur ve tableId değerini ver
            var inputElement = $('<input>')
                .attr('type', 'hidden')
                .attr('name', 'table-id-input')
                .val(tableId);

            var inputElement2 = $('<input>')
                .attr('type', 'hidden')
                .attr('name', 'table-name-input')
                .val(tableName);

            // .tableMenuContainer içine input alanını ekle
            $('.tableMenuContainer .content').append(inputElement);
            $('.tableMenuContainer .content').append(inputElement2);
        }
        catch (e) {
            console.error(e);
        }
       

    });

    $('.numberBtn button').click(function (e) {
        try {
            var value = $(this).text(); // Tıklanan butonun içeriğini al
            var currentValue = $('.payInput').val(); // payInput alanının mevcut değerini al
            var newValue = currentValue + value; // Buton değerini mevcut değere ekle

            // Sadece sayılar, nokta ve noktadan sonra en fazla 2 basamak kabul edilecek şekilde güncellenmiş regex
            var sanitizedValue = newValue.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.?\d{0,2}).*/, '$1');

            $('.payInput').val(sanitizedValue); // Değiştirilmiş değeri payInput alanına yaz

            // Geri kalan işlemler
            if (parseFloat($('.payInput').val()) > 0) {
                $('.pay-btn .payTypeTitle').css('background-color', 'red');
                $('.pay-btn .payTypeTitle').css('color', '#fff');
                let title =
                    `Ödeme Türünü Seçin <i class="fa fa-arrow-down" aria-hidden="true"></i>
                `;
                $('.pay-btn .payTypeTitle').html(title);
            } else {
                $('.pay-btn .payTypeTitle').css('background-color', 'white');
                $('.pay-btn .payTypeTitle').css('color', 'black');
                $('.pay-btn .payTypeTitle').text('Ödeme Türleri');
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('#angle-left').click(function () {
        try {
            var currentValue = $('.payInput').val(); // Mevcut payInput değerini al
            var newValue = currentValue.slice(0, -1); // Son karakteri kaldır

            // Sadece sayılar, nokta ve noktadan sonra en fazla 2 basamak kabul edilecek şekilde güncellenmiş regex
            var sanitizedValue = newValue.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.?\d{0,2}).*/, '$1');

            $('.payInput').val(sanitizedValue); // Değiştirilmiş değeri payInput alanına yaz

            // Geri kalan işlemler
            if (parseFloat($('.payInput').val()) > 0) {
                $('.pay-btn .payTypeTitle').css('background-color', 'red');
                $('.pay-btn .payTypeTitle').css('color', '#fff');
                let title =
                    `Ödeme Türünü Seçin <i class="fa fa-arrow-down" aria-hidden="true"></i>
                `;
                $('.pay-btn .payTypeTitle').html(title);
            } else {
                $('.pay-btn .payTypeTitle').css('background-color', 'white');
                $('.pay-btn .payTypeTitle').css('color', 'black');
                $('.pay-btn .payTypeTitle').text('Ödeme Türleri');
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });


    $(document).on('click', '.tableMenuContainer .close-icon', function () {
        $('.tableMenuContainer').css("display", "none");
    });

    $(document).on('click', '.PayModal .close-icon-pay-modal', function () {
        $('.PayModal').css("display", "none");
    });
    $(document).on('click', '.PayFastlyModal .close-icon-pay-fastly-modal', function () {
        $('.PayFastlyModal').css("display", "none");
    });
    $(document).on('click', '.ChangeTableModal .close-icon-change-table-modal', function () {
        $('.ChangeTableModal').css("display", "none");
    });

    $(document).on('click', '.ConcatTablesModal .close-icon-combine-table-modal', function () {
        $('.ConcatTablesModal').css("display", "none");
    });






    $(document).on('click', '.tableMenuContainer .credit-card', function () {
        try {
            cardPaid = 0;
            cashPaid = 0;
            discountPaid = 0;
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var tableName = $('input[name="table-name-input"]').val();
            $('.PayModal .table-orders').empty();
            $('.PayModal .title .tableName').text(tableName);
            $('.tableMenuContainer').css("display", "none");
            $('.PayModal').css('display', 'flex');
            if (tableId !== null && tableId !== undefined) {
                var table = Tables.find(x => x.TableId === tableId);
                var orders = JSON.parse(table.Orders);
                let totalPrice = 0;
                orders.forEach(function (order) {
                    totalPrice += order.productPrice;
                    var orderHTML = `
                    <div>
                        <span id="title"> ${order.productName} </span>
                        
                        <span id="price"> ${order.productPrice.toFixed(2)}TL</span>
                    </div>`;
                    $('.PayModal .table-orders').append(orderHTML);
                });
                var inputElement = $('<input>')
                    .attr('type', 'hidden')
                    .attr('name', 'total-price')
                    .val(totalPrice);
                $('.totalStrong').text(totalPrice.toFixed(2) + 'TL');
                $('.PayModal input[name="total-price"]').remove();
                $('.PayModal').append(inputElement);
                $('.PayModal input[name="remainder"]').val(totalPrice.toFixed(2));
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });



    $(document).on('click', '.tableMenuContainer .pay-fastly', function () {
        try {
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var tableName = $('input[name="table-name-input"]').val();
            $('.PayFastlyModal .title .tableName').text(tableName);
            $('.tableMenuContainer').css("display", "none");
            $('.PayFastlyModal').css('display', 'flex');
            if (tableId !== null && tableId !== undefined) {
                var table = Tables.find(x => x.TableId === tableId);
                var orders = JSON.parse(table.Orders);
                let totalPrice = 0;
                orders.forEach(function (order) {
                    totalPrice += order.productPrice;

                });
                var inputElement = $('<input>')
                    .attr('type', 'hidden')
                    .attr('name', 'total-price')
                    .val(totalPrice);
                $('.totalStrong').text(totalPrice.toFixed(2) + 'TL');
                $('.PayFastlyModal input[name="total-price"]').remove();
                $('.PayFastlyModal').append(inputElement);
                $('.PayFastlyModal input[name="remainder"]').val(totalPrice.toFixed(2));
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });
    $('.tableMenuContainer .menuProcess .print-receipt').on('click', function () {
       

        try {
            var tableId = parseInt($('input[name="table-id-input"]').val());
            let findedTable = Tables.find(x => x.TableId === tableId);
           

            let additionOrders = JSON.parse(findedTable.Orders);
          

            let newAddition = [];
            let totalCost = 0;

            additionOrders.map(x => {
                totalCost = (parseFloat(x.productPrice) + parseFloat(totalCost)).toFixed(2);
                let finded = newAddition.find((item) => item.productId === x.productId && item.productNote.length === 0);
                if (finded) {
                    finded.quantity += 1;
                } else {
                    newAddition.push({
                        productId: x.productId,
                        productName: x.productName,
                        productNote: x.productNote,
                        productPrice: parseFloat(x.productPrice).toFixed(2),
                        quantity: 1,
                    });
                }
            });

            let responseOrders = newAddition;
            let responsTotalCost = parseFloat(totalCost).toFixed(2);

            // Convert /Date(1723054438420)/ format to JavaScript Date
            let orderDateMatch = findedTable.OrderDate.match(/\/Date\((\d+)\)\//);
            if (orderDateMatch) {
                let orderDateMilliseconds = parseInt(orderDateMatch[1], 10);
                var orderDate = new Date(orderDateMilliseconds);
                if (isNaN(orderDate.getTime())) {
                    console.error('Invalid date format:', findedTable.OrderDate);
                    return;
                }
            } else {
                console.error('Invalid date format:', findedTable.OrderDate);
                return;
            }

            let responseOrderDate = orderDate.toISOString();
            let responseTableName = findedTable.TableName;
            let responseUserName = $('input[name="UserName"]').val();

            let orderDATA = {
                UserName: responseUserName,
                TableName: responseTableName,
                OrderDate: responseOrderDate,
                Orders: responseOrders,
                TotalCost: responsTotalCost
            };

            fetch('http://localhost:8081/', {
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

        } catch (e) {
            console.error(e);
        }
    });




    $('.tableMenuContainer .menuProcess .cancel-order').on('click', function () {
        try {
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var tableName = $('input[name="table-name-input"]').val();
            if (!isNaN(tableId)) {

                if (confirm(`${tableName} iptal edilecek.Onaylıyor musunuz ?`)) {
                    $.ajax({
                        url: `/Reckoning/MakeDeActiveThisTable/${tableId}`,
                        type: 'PUT',
                        success: function (response) {
                            window.location.href = `/Reckoning/Tables`;

                        },
                        error: function (xhr, status, error) {
                            console.error(errror);
                        }
                    });
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });
    $(document).on('click', '.tableMenuContainer .change-table', function () {
        try {
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var tableName = $('input[name="table-name-input"]').val();
            $('.ChangeTableModal .title .tableName').text(tableName);
            $('.tableMenuContainer').css("display", "none");
            $('.ChangeTableModal').css('display', 'flex');
            if (tableId !== null || tableId !== undefined) {
                var table = Tables.find(x => x.TableId === tableId);
                var orders = JSON.parse(table.Orders);
                let totalPrice = 0;
                orders.forEach(function (order) {
                    totalPrice += order.productPrice;

                });
                $('.totalStrong').text(totalPrice.toFixed(2) + 'TL');

                let optionHTML = ``;
                Tables.forEach(function (table) {
                    if (table.Status === 0) {
                        optionHTML += `<option value="${table.TableId}"> ${table.TableName} </option>`;
                    }
                });


                $('.ChangeTableModal .select').empty();
                let selectHTML = ` 
                    <label> Değiştirilecek Masa </label>
                    <select name="tables">
                        ${optionHTML}
                    </select>
            `;
                $('.ChangeTableModal .menuProcess .select').append(selectHTML);

            }
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $(document).on('click', '.tableMenuContainer .concat-additions', function () {
        try {
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var tableName = $('input[name="table-name-input"]').val();
            $('.ConcatTablesModal .title .tableName').text(tableName);
            $('.tableMenuContainer').css("display", "none");
            $('.ConcatTablesModal').css('display', 'flex');
            if (tableId !== null || tableId !== undefined) {
                var table = Tables.find(x => x.TableId === tableId);
                var orders = JSON.parse(table.Orders);
                let totalPrice = 0;
                orders.forEach(function (order) {
                    totalPrice += order.productPrice;

                });



                $('.totalStrong').text(totalPrice.toFixed(2) + 'TL');
                $('.ConcatTablesModal .menuProcess .concat').empty();

                let option = ``;

                Tables.forEach(function (table) {

                    if (table.TableId !== tableId && table.Status === 1) {


                        option += `
                    <option value="${table.TableId}">${table.TableName}</option>

                    `;

                    }
                });

                let dropdownHTML = `
                 <label for="tables">Masa Seçin</label>

                   <select  name="table-select" aria-label="Default select example">
                      ${option}
                    </select>
            `;
                $('.ConcatTablesModal .menuProcess .concat').append(dropdownHTML);


            }
        }
        catch (e) {
            console.error(e);
        }
        
    });







    let cashPaid = 0;
    $('.numbersContainer .cash-btn').on('click', function () {

        try {
            let total = $('.PayModal input[name="total-price"]').val();
            let entried = $('.PayModal input[name="payInput"]').val();
            let remainderValue = $('.PayModal input[name="remainder"]').val();
            let remainder = remainderValue - entried;
            if (remainder >= 0 && entried > 0) {
                $('.PayModal input[name="remainder"]').val(remainder.toFixed(2));
                $('.PayModal input[name="payInput"]').val("");
                cashPaid += parseFloat(entried);
                $('.pay-btn .payTypeTitle').css('background-color', 'white');
                $('.pay-btn .payTypeTitle').css('color', 'black');
                $('.pay-btn .payTypeTitle').text('Ödeme Türleri');
            }
            else {
                $('.pay-btn .payTypeTitle').text('Hatalı Tutar!');

            }
        }
        catch (e) {
            console.error(e);
        }
        
    });
    let cardPaid = 0;
    $('.numbersContainer .card-btn').on('click', function () {

        try {
            let total = $('.PayModal input[name="total-price"]').val();
            let entried = $('.PayModal input[name="payInput"]').val();
            let remainderValue = $('.PayModal input[name="remainder"]').val();
            let remainder = remainderValue - entried;
            if (remainder >= 0 && entried > 0) {
                $('.PayModal input[name="remainder"]').val(remainder.toFixed(2));
                $('.PayModal input[name="payInput"]').val("");
                cardPaid += parseFloat(entried);
                $('.pay-btn .payTypeTitle').css('background-color', 'white');
                $('.pay-btn .payTypeTitle').css('color', 'black');
                $('.pay-btn .payTypeTitle').text('Ödeme Türleri');
            }
            else {
                $('.pay-btn .payTypeTitle').text('Hatalı Tutar!');

            }
        }
        catch (e) {
            console.error(e);
        }

        
    });
    let discountPaid = 0;
    $('.numbersContainer .discount-btn').on('click', function () {

        try {
            let total = $('.PayModal input[name="total-price"]').val();
            let entried = $('.PayModal input[name="payInput"]').val();
            let remainderValue = $('.PayModal input[name="remainder"]').val();
            let remainder = remainderValue - entried;
            if (remainder >= 0 && entried > 0) {
                $('.PayModal input[name="remainder"]').val(remainder.toFixed(2));
                $('.PayModal input[name="payInput"]').val("");
                discountPaid += parseFloat(entried);
                $('.pay-btn .payTypeTitle').css('background-color', 'white');
                $('.pay-btn .payTypeTitle').css('color', 'black');
                $('.pay-btn .payTypeTitle').text('Ödeme Türleri');
            }
            else {
                $('.pay-btn .payTypeTitle').text('Hatalı Tutar!');

            }
        }
        catch (e) {
            console.error(e);
        }
        
    });


    function parseJsonDateString(jsonDate) {
        try {
            var regex = /^\/Date\((-?\d+)(\+|-)?(\d+)?\)\/$/;
            var matches = regex.exec(jsonDate);
            if (matches) {
                var milliseconds = parseInt(matches[1]);
                return new Date(milliseconds);
            }
            return null;
        }
        catch (e) {
            console.error(e);
        }
        
    }
    $('.PayModal .completeBillBtn').on('click', function () {
        try {
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var tableName = $('input[name="table-name-input"]').val();
            let remainder = parseFloat($('.PayModal input[name="remainder"]').val());

            if (tableId !== null && tableId !== undefined) {
                var table = Tables.find(x => x.TableId === tableId);
                var orders = JSON.parse(table.Orders);
                let totalPrice = 0;
                orders.forEach(function (order) {
                    totalPrice += order.productPrice;
                });
                let orderStartingDate = parseJsonDateString(table.OrderDate);
                let formData = new FormData();
                formData.append('TableId', tableId);
                formData.append('TableName', tableName);
                formData.append('Orders', JSON.stringify(orders));
                formData.append('PaymentCash', cashPaid.toFixed(2));
                formData.append('PaymentCard', cardPaid.toFixed(2));
                formData.append('PaymentDiscount', discountPaid.toFixed(2));
                formData.append('OrderStartingDate', orderStartingDate.toJSON());


                if (parseFloat(remainder) === 0) {
                    $.ajax({
                        url: `/Reckoning/AddTableSalesHistory`,
                        type: 'POST',
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (response) {


                           
                            let findedTable = Tables.find(x => x.TableId === tableId);

                            let additionOrders = JSON.parse(findedTable.Orders);

                            let newAddition = [];


                            let totalCost = 0;
                            additionOrders.map(x => {
                                totalCost = (parseFloat(x.productPrice) + parseFloat(totalCost)).toFixed(2);
                                let finded = newAddition.find((item) => item.productId === x.productId && item.productNote.length === 0);
                                if (finded) {
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
                            
                            let orderDateMatch = findedTable.OrderDate.match(/\/Date\((\d+)\)\//);
                            if (orderDateMatch) {
                                let orderDateMilliseconds = parseInt(orderDateMatch[1], 10);
                                var orderDate = new Date(orderDateMilliseconds);
                                if (isNaN(orderDate.getTime())) {
                                    console.error('Invalid date format:', findedTable.OrderDate);
                                    return;
                                }
                            } else {
                                console.error('Invalid date format:', findedTable.OrderDate);
                                return;
                            }

                            let responseUserName = $('input[name="UserName"]').val();
                            let responseTableName = findedTable.TableName;
                            let responseOrderDate = orderDate.toISOString();
                            let responseOrders = newAddition;
                            let responseTotalCost = (parseFloat(totalCost) - parseFloat(discountPaid)).toFixed(2);
                            let responseDiscount = discountPaid.toFixed(2);
                            let orderDATA = {
                                UserName: responseUserName,
                                TableName: responseTableName,
                                OrderDate: responseOrderDate,
                                Orders: responseOrders,
                                TotalCost: responseTotalCost,
                                Discount: responseDiscount
                            };
                          

                            fetch('http://localhost:8081/printdiscountreceipt', {
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
                                   
                                    window.location.href = '/Reckoning/Tables';
                                })
                                .catch(error => {
                                    console.error('Error:', error);
                                });

                            window.location.href = '/Reckoning/Tables';
                        },
                        error: function (xhr, status, error) {
                            console.error(error);
                        }
                    });
                }
                else {


                }


            }
        }
        catch (e) {
            console.error(e);
        }
        
    })
    $('.PayFastlyModal .fastly-cash').on('click', function () {
        try {
            var isPrintValue = $('.PayFastlyModal input[name="isPrinting"]').is(':checked');
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var tableName = $('input[name="table-name-input"]').val();

            if (!isNaN(tableId)) {
                var table = Tables.find(x => x.TableId === tableId);
                var orders = JSON.parse(table.Orders);
                let totalPrice = 0;
                orders.forEach(function (order) {
                    totalPrice += order.productPrice;
                });

                let orderStartingDate = parseJsonDateString(table.OrderDate);
                let formData = new FormData();
                formData.append('TableId', tableId);
                formData.append('TableName', tableName);
                formData.append('Orders', JSON.stringify(orders));
                formData.append('PaymentCash', totalPrice.toFixed(2));
                formData.append('PaymentCard', (0).toFixed(2));
                formData.append('PaymentDiscount', (0).toFixed(2));
                formData.append('OrderStartingDate', orderStartingDate.toJSON());

                formData.append('IsPrinting', isPrintValue); // Ekledim

                $.ajax({
                    url: '/Reckoning/AddTableSalesHistory',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        if (isPrintValue) {
                            let findedTable = Tables.find(x => x.TableId === tableId);

                            let additionOrders = JSON.parse(findedTable.Orders);

                            let newAddition = [];


                            let totalCost = 0;
                            additionOrders.map(x => {
                                totalCost = (parseFloat(x.productPrice) + parseFloat(totalCost)).toFixed(2);
                                let finded = newAddition.find((item) => item.productId === x.productId && item.productNote.length === 0);
                                if (finded) {
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

                            ///----
                            let responseOrders = newAddition;
                            let responsTotalCost = parseFloat(totalCost).toFixed(2);

                            // Convert /Date(1723054438420)/ format to JavaScript Date
                            let orderDateMatch = findedTable.OrderDate.match(/\/Date\((\d+)\)\//);
                            if (orderDateMatch) {
                                let orderDateMilliseconds = parseInt(orderDateMatch[1], 10);
                                var orderDate = new Date(orderDateMilliseconds);
                                if (isNaN(orderDate.getTime())) {
                                    console.error('Invalid date format:', findedTable.OrderDate);
                                    return;
                                }
                            } else {
                                console.error('Invalid date format:', findedTable.OrderDate);
                                return;
                            }

                            let responseOrderDate = orderDate.toISOString();
                            let responseTableName = findedTable.TableName;
                            let responseUserName = $('input[name="UserName"]').val();

                            let orderDATA = {
                                UserName: responseUserName,
                                TableName: responseTableName,
                                OrderDate: responseOrderDate,
                                Orders: responseOrders,
                                TotalCost: responsTotalCost
                            };

                            fetch('http://localhost:8081/', {
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
                                  
                                    window.location.href = '/Reckoning/Tables';
                                })
                                .catch(error => {
                                    console.error('Error:', error);
                                });
                            window.location.href = '/Reckoning/Tables';
                        }
                        else {

                            window.location.href = '/Reckoning/Tables';
                        }
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

    $('.PayFastlyModal .fastly-credit-card').on('click', function () {
        try {
            var isPrintValue = $('.PayFastlyModal input[name="isPrinting"]').is(':checked');
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var tableName = $('input[name="table-name-input"]').val();


            if (tableId !== null && tableId !== undefined) {
                var table = Tables.find(x => x.TableId === tableId);
                var orders = JSON.parse(table.Orders);
                let totalPrice = 0;
                orders.forEach(function (order) {
                    totalPrice += order.productPrice;
                });

                let orderStartingDate = parseJsonDateString(table.OrderDate);
                let formData = new FormData();
                formData.append('TableId', tableId);
                formData.append('TableName', tableName);
                formData.append('Orders', JSON.stringify(orders));
                formData.append('PaymentCash', (0).toFixed(2));
                formData.append('PaymentCard', totalPrice.toFixed(2));
                formData.append('PaymentDiscount', (0).toFixed(2));

                formData.append('OrderStartingDate', orderStartingDate.toJSON());

                $.ajax({
                    url: `/Reckoning/AddTableSalesHistory`,
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        if (isPrintValue) {
                            let findedTable = Tables.find(x => x.TableId === tableId);

                            let additionOrders = JSON.parse(findedTable.Orders);

                            let newAddition = [];


                            let totalCost = 0;
                            additionOrders.map(x => {
                                totalCost = (parseFloat(x.productPrice) + parseFloat(totalCost)).toFixed(2);
                                let finded = newAddition.find((item) => item.productId === x.productId && item.productNote.length === 0);
                                if (finded) {
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

                            //-------
                            let responseOrders = newAddition;
                            let responsTotalCost = parseFloat(totalCost).toFixed(2);

                            // Convert /Date(1723054438420)/ format to JavaScript Date
                            let orderDateMatch = findedTable.OrderDate.match(/\/Date\((\d+)\)\//);
                            if (orderDateMatch) {
                                let orderDateMilliseconds = parseInt(orderDateMatch[1], 10);
                                var orderDate = new Date(orderDateMilliseconds);
                                if (isNaN(orderDate.getTime())) {
                                    console.error('Invalid date format:', findedTable.OrderDate);
                                    return;
                                }
                            } else {
                                console.error('Invalid date format:', findedTable.OrderDate);
                                return;
                            }

                            let responseOrderDate = orderDate.toISOString();
                            let responseTableName = findedTable.TableName;
                            let responseUserName = $('input[name="UserName"]').val();

                            let orderDATA = {
                                UserName: responseUserName,
                                TableName: responseTableName,
                                OrderDate: responseOrderDate,
                                Orders: responseOrders,
                                TotalCost: responsTotalCost
                            };

                            fetch('http://localhost:8081/', {
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
                                   
                                    window.location.href = '/Reckoning/Tables';
                                })
                                .catch(error => {
                                    console.error('Error:', error);
                                });
                            window.location.href = '/Reckoning/Tables';
                        }
                        else {

                            window.location.href = '/Reckoning/Tables';
                        }
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
        
    })


    $('.ChangeTableModal .menuProcess .change-table').on('click', function () {
        try {
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var changeTableId = parseInt($('.ChangeTableModal select[name="tables"]').val());
            if (tableId !== null || tableId !== undefined || changeTableId !== null || changeTableId !== undefined) {


                $.ajax({
                    url: `/Reckoning/ChangeTables`,
                    type: 'PUT',
                    data: {
                        id: tableId,
                        changeTableId: changeTableId
                    },
                    success: function (response) {
                        window.location.href = `/Reckoning/Tables`;
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }
                });
            };
        }
        catch (e) {
            console.error(e);
        }
        
    })

    $('.ConcatTablesModal .menuProcess .concatBtn').on('click', function () {
        try {
            var tableId = parseInt($('input[name="table-id-input"]').val());

            if (tableId !== null && tableId !== undefined) {
                var table = Tables.find(x => x.TableId === tableId);

                // Get selected table ID from the dropdown
                var selectedTableId = $('.ConcatTablesModal .menuProcess select[name="table-select"]').val();

                if (selectedTableId) {
                    selectedTableId = parseInt(selectedTableId);


                    let currentOrders = JSON.parse(table.Orders);
                    let newOrders = JSON.parse(Tables.find(x => x.TableId === selectedTableId).Orders);

                    let concatOrders = currentOrders.concat(newOrders);


                 
                

                    let formData = new FormData();
                    formData.append('CurrentTableId', tableId);
                    formData.append('SelectedTableId', selectedTableId);
                    formData.append('ConcatOrders', JSON.stringify(concatOrders));

                    $.ajax({
                        url: `/Reckoning/ConcatTables`,
                        type: 'PUT',
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (response) {

                            window.location.href = `/Reckoning/Tables`;
                        },
                        error: function (xhr, status, error) {
                            console.error(error);
                        }
                    });

                    // Example of how you might use the selectedTableId
                    // You can now use the selectedTableId to perform actions or updates
                } else {
                   
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });

   
    function numericCompare(a, b) {
        try {
            // Alfanümerik sıralama için regular expression
            const re = /(\d+)|(\D+)/g;

            const chunksA = a.match(re);
            const chunksB = b.match(re);

            for (let i = 0; i < Math.min(chunksA.length, chunksB.length); i++) {
                const chunkA = chunksA[i];
                const chunkB = chunksB[i];

                // Eğer her iki parça da sayıysa
                if (!isNaN(chunkA) && !isNaN(chunkB)) {
                    const numA = parseInt(chunkA, 10);
                    const numB = parseInt(chunkB, 10);
                    if (numA !== numB) {
                        return numA - numB;
                    }
                } else if (chunkA !== chunkB) {
                    // Metin parçası karşılaştırması
                    return chunkA.localeCompare(chunkB);
                }
            }

            return chunksA.length - chunksB.length;
        }
        catch (e) {
            console.error(e);
        }
        
    }

    function ShowTable(tables, activeId) {
        try {
            $(".tablesContainer").empty();

            tables = tables.filter((table) => table.TableCategorieId === activeId);


            tables.forEach(function (table) {
                var tableHTML = ``;
                let totalPrice = 0;

                if (table.Status === 0) {
                    tableHTML = `
               <div class="tables">
                    <button class="GoTableDetail" data-tableid="${table.TableId}">
                        ${table.TableName}
                    </button>
                </div>`;
                } else {
                    let activeTable = tables.find(x => x.TableId === table.TableId);
                    let orders = JSON.parse(activeTable.Orders);

                    orders?.forEach(function (order) {
                        totalPrice += order.productPrice;
                    });

                    tableHTML = `
               <div class="tables activeTable">
                     <input type="hidden" name="table-id" value="${table.TableId}" />
                     <input type="hidden" name="table-name" value="${table.TableName}" />
                     
                    <button class="GoTableDetail" data-tableid="${table.TableId}">
                        <div class="tableTitle">
                            <span>${table.TableName}</span>
                            <i class="fa fa-bars" aria-hidden="true"></i>
                        </div>
                        <div class="tableTime">
                           
                        </div>
                        <div class="tablePrice">
                            <span>${totalPrice.toFixed(2)}TL</span>
                        </div>
                    </button>
                </div>`;
                }

                $(".tablesContainer").append(tableHTML);
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }


    $('.notifications').on('click','.openNotifications', function () { 

        $('.NotificationModal').css('display', 'flex');

    })
    $('.NotificationModal').on('click', '.close-icon-notification', function () {

        $('.NotificationModal').css('display', 'none');

    })
    $('.NotificationModal .content').on('click', '.printInvoice', function (e) {

        try {
            e.preventDefault();
            let notificationId = $(this).data('notification-id');
            let findedNotification = Notifications.find(x => x.NotificationId === notificationId);
            let additionOrders = JSON.parse(findedNotification.Orders);
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


            let orderDATA = {
                UserName: $('input[name="UserName"]').val(),
                TableName: findedNotification.TableName,
                OrderDate: findedNotification.OrderDate,
                Orders: newAddition,
                TotalCost: totalCost
            };
            fetch('http://localhost:8081/printinvoice', {
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


            $.ajax({
                url: `/Reckoning/DeleteNotification/${notificationId}`,
                type: 'DELETE',
                contentType: false,
                processData: false,
                success: function (response) {
                    
                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
            Notifications = Notifications.filter(x => x.NotificationId !== notificationId);
            showNotifications(Notifications, Waiters);
        }
        catch (e) {
            console.error(e);
        }


    })
    $('.NotificationModal .content').on('click', '.deleteInvoice', function (e) {
        try {
            e.preventDefault();
            let notificationId = $(this).data('notification-id');
            $.ajax({
                url: `/Reckoning/DeleteNotification/${notificationId}`,
                type: 'DELETE',
                contentType: false,
                processData: false,
                success: function (response) {

                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
            Notifications = Notifications.filter(x => x.NotificationId !== notificationId);
            showNotifications(Notifications, Waiters);
        }
        catch (e) {
            console.error(e);
        }
    })
    $('.NotificationModal').on('click', '.deleteAllNotifications', function (e) {
        try {
            e.preventDefault();
            if (confirm("Tüm garson bildirimleri silmek istediğinize emin misiniz?")) {
                let userId = Notifications[0]?.UserId;
               
                if (userId) {
                    $.ajax({
                        url: `/Reckoning/DeleteAllNotifications/${userId}`,
                        type: 'DELETE',
                        contentType: false,
                        processData: false,
                        success: function (response) {
                            Notifications = [];
                            showNotifications(Notifications, Waiters);
                            $('.NotificationModal').css('display', 'none');
                            $('.notifications').css('display', 'none');
                        },
                        error: function (xhr, status, error) {
                            console.error(error);
                        }
                    });

                }
            }
        }
        catch (e) {
            console.error(e);
        }
    })



});


    