$(document).ready(function () {
    
    function generateRandomId() {
        try {
            let randomId = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (let i = 0; i < 21; i++) {
                randomId += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return randomId;
        }
        catch (e) {
            console.error(e);
        }

        
    }
    let allProducts = [];
    let addition = [];
    let isSaveButtonClicked = false;
    let orders = $('input[name="Orders"]').val();

    if (orders) {
        addition = JSON.parse(orders);
        displayOrders()
    }

    $(window).on('beforeunload', function (e) {
        try {
            if (addition.length > 0 && !isSaveButtonClicked) { // Bayrağı kontrol et
                const message = "Değişiklikleriniz kaydedilmemiş olabilir. Sayfayı terk etmek istediğinizden emin misiniz?";
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });
    

    let categoryId = $('.categorieBtn').first().data('category-id');

    $('.categorieBtn').on('click', function () {
        try {
            categoryId = $(this).data('category-id');

            filterAndDisplayProducts(categoryId);

            // Tüm kategori düğmelerinin arka plan rengini varsayılan hale getir
            $('.categorieBtn').css('border-bottom', '');

            // Seçili kategori düğmesinin arka plan rengini sarı yap
            $(this).css('border-bottom', '4px solid cornflowerblue');
        }
        catch (e) {
            console.error(e);
        }
        
    });

    try {
        // Ürünleri almak için AJAX çağrısı
        $.ajax({
            url: '/Reckoning/GetAllMenuProductsToUser',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                allProducts = response;
                filterAndDisplayProducts(categoryId);

                // İlk kategori düğmesinin arka plan rengini sarı yap
                $('.categorieBtn').first().css('border-bottom', '4px solid cornflowerblue');
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }
   

    function filterAndDisplayProducts(categoryId) {
        try {
            const productContainer = $('.menuProducts');
            productContainer.empty();

            allProducts.forEach(product => {
                if (product.CategoryId === categoryId) {



                    // Generate product HTML
                    const productElement = `
                    <div class="product " data-product-id="${product.ProductId}" data-product-price="${parseFloat(product.ProductPrice).toFixed(2)}">
                        <span class="productName">${product.ProductName}</span>
                        <div class="note">
                            <input type="text" maxLength="40" autocomplete="off"  name="note" placeholder="Not" />
                        </div>
                        <div class="addbtn-price">
                            <button class="addAddition">Ekle</button>
                            <span class="productPrice">${parseFloat(product.ProductPrice).toFixed(2)}TL</span>  
                        </div>
                    </div>`;

                    productContainer.append(productElement);
                }
            });

            // Bind click event to product elements to add to addition array
            $('.addAddition').off('click').on('click', function (event) {
                try {

                }
                catch (e) {
                    console.error(e);
                }
                

                // Prevent default action if necessary
                event.preventDefault();

                // Prevent multiple additions of the same product
                let productId = $(this).closest('.product').data('product-id');

                const productElement = $(this).closest('.product');
                const productName = productElement.find('.productName').text();
                const productNote = productElement.find('input[name="note"]').val();
                const productPrice = parseFloat(productElement.data('product-price')); // Use initial price here

                const randomId = generateRandomId();

                addition.push({
                    randomId: randomId,
                    productId: productId,
                    productName: productName,
                    productNote: productNote,
                    productPrice: productPrice,
                });
             

                displayOrders();

                productElement.find('input[name="note"]').val('');
            });

            $('.orders').on('click', '.delete-addition', function () {
                
                let randomId = $(this).siblings('.random-id').val();

                addition = addition.filter(item => item.randomId !== randomId);
                displayOrders();
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    

    function displayOrders() {
        try {
            const ordersContainer = $('.orders');
            ordersContainer.empty();

            let totalAmount = 0;

            // Addition dizisinin varlığını ve doğruluğunu kontrol et
            if (addition && Array.isArray(addition)) {
                addition.forEach(item => {

                    // Her bir item'in doğruluğunu kontrol et
                    if (item && item.productName && item.productPrice) {


                        const orderItem = `
                <div class="orderItem">
                    <input type="hidden" class="random-id" value="${item.randomId}" /> 
                    <i class="fa fa-trash  delete-addition" aria-hidden="true"></i>
                    <div class="content">
                        <div id="title">
                            <span class="orderProductName">${item.productName}</span>
                            <span class="orderProductPrice">${item.productPrice.toFixed(2)}TL</span>
                        </div>
                        
                        <div id="willRemove">
                            <label> Not </label>
                            <span class="note"> ${item.productNote} </span>
                        </div>
                    </div>
                </div>`;

                        ordersContainer.append(orderItem);

                        // Toplam tutarı güncelle
                        totalAmount += item.productPrice;
                    }
                });
            } else {
                console.error('Addition array is invalid or empty.');
            }

            $('.foot label').text(totalAmount.toFixed(2) + 'TL');
        }
        catch (e) {
            console.error(e);
        }
        
    }
   
    $('.save-btn').on('click', function () {
        try {
            isSaveButtonClicked = true;
            let tableId = parseInt($('input[name="TableId"]').val());
            let tableName = $('input[name="TableName"]').val();
        


            if (addition.length > 0) {

                let formData = new FormData();
                formData.append('Orders', JSON.stringify(addition));
                let additionOrders = addition;
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
                

                var now = new Date();
                var dateTimeString = now.toISOString();
                let responseUserName = $('input[name="UserName"]').val();
                let responseTableName = tableName;
                let responseOrderDate = dateTimeString;
                let responseOrders = newAddition;
                let responseTotalCost = totalCost;

                
                let orderDATA = {
                    UserName: responseUserName,
                    TableName: responseTableName,
                    OrderDate: responseOrderDate,
                    Orders: responseOrders,
                    TotalCost: responseTotalCost
                };

                $.ajax({
                    url: `/Reckoning/MakeActiveThisTable/${tableId}`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
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
                        window.location.href = '/Reckoning/Tables';
                        
                    },
                    error: function (xhr, status, error) {
                        console.error("Error updating product:", error);
                    }
                });



            }
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('.deleteTable').on('click', function () {
        try {
            let tableId = parseInt($('input[name="TableId"]').val());
            if (confirm("Masayı silmek istediğinize emin misiniz?")) {
                let formData = new FormData();
                formData.append('TableId', tableId);
                $.ajax({
                    url: `/Reckoning/DeleteTable/${tableId}`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        window.location.href = `/Reckoning/Tables`;
                    },
                    error: function (xhr, status, error) {
                        console.error("Error updating product:", error);
                    }
                });
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });
});
