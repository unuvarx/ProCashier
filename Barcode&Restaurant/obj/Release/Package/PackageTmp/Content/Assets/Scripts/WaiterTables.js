$(document).ready(function () {
    let Tables = [];
    let TableCategories = [];
    let activeCategorieId;
    let interval;


    try {
        $.ajax({
            url: '/Waiters/GetTableCategories',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                try {
                    TableCategories = response;
                    activeCategorieId = response[0].TableCategorieId;

                    showTableCategories(TableCategories);
                    $.ajax({
                        url: '/Waiters/GetTables',
                        type: 'GET',
                        dataType: 'json',
                        success: function (response) {
                            Tables = response.sort((a, b) => numericCompare(a.TableName.toLowerCase(), b.TableName.toLowerCase()));

                            ShowTable(Tables, activeCategorieId);
                            startTimer();
                        },
                        error: function (xhr, status, error) {
                            console.error(error);
                        }
                    });
                }
                catch (e) {
                    console.error(e)
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
    

    $(document).on('click', '.tables button.GoTableDetail', function () {
        try {
            var tableId = $(this).data('tableid');
            window.location.href = `/Waiters/TableDetail/${tableId}`;
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

    

    

    $(document).on('click', '.tableMenuContainer .close-icon', function () {

        $('.tableMenuContainer').css("display", "none");
    });

   
    $(document).on('click', '.ChangeTableModal .close-icon-change-table-modal', function () {
        $('.ChangeTableModal').css("display", "none");
    });

    $(document).on('click', '.ConcatTablesModal .close-icon-combine-table-modal', function () {
        $('.ConcatTablesModal').css("display", "none");
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
    
    

    


    $('.ChangeTableModal .menuProcess .change-table').on('click', function () {
        try {
            var tableId = parseInt($('input[name="table-id-input"]').val());
            var changeTableId = parseInt($('.ChangeTableModal select[name="tables"]').val());
            if (tableId !== null || tableId !== undefined || changeTableId !== null || changeTableId !== undefined) {


                $.ajax({
                    url: `/Waiters/ChangeTables`,
                    type: 'PUT',
                    data: {
                        id: tableId,
                        changeTableId: changeTableId
                    },
                    success: function (response) {
                        window.location.href = `/Waiters/Tables`;
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
                        url: `/Waiters/ConcatTables`,
                        type: 'PUT',
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (response) {

                            window.location.href = `/Waiters/Tables`;
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

});


