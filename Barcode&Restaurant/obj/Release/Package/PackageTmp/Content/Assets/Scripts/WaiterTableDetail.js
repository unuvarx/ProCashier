$(document).ready(function () {



    function generateRandomId() {
        let randomId = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 21; i++) {
            randomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return randomId;
    }
    let allProducts = [];
    let addition = [];
    let orders = $('input[name="Orders"]').val();
    let isSaveButtonClicked = false;
    if (orders) {
        addition = JSON.parse(orders);
        displayOrders()
    }




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

    try {
        $.ajax({
            url: '/Waiters/GetAllMenuProductsToUser',
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
                            <input type="text" autocomplete="off" maxLength="40"  name="note" placeholder="Not" />
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
                // Check if the click was on the note input or its parent
                if ($(event.target).closest('input[name="note"]').length > 0) {
                    return; // If clicked on the note input or its parent, do nothing
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
            // Yeni bir array oluştur


            if (addition.length > 0) {

                let formData = new FormData();
                formData.append('Orders', JSON.stringify(addition));

                let formData2 = new FormData();
               
                formData2.append('TableId', tableId);
                formData2.append('Orders', JSON.stringify(addition));
                formData2.append('TableName', tableName);
                $.ajax({
                    url: `/Waiters/MakeActiveThisTable/${tableId}`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        $.ajax({
                            url: `/Waiters/AddNotification`,
                            type: 'POST',
                            data: formData2,
                            processData: false,
                            contentType: false,
                            success: function (response) {
                                window.location.href = `/Waiters/Tables`;

                            },
                            error: function (xhr, status, error) {
                                console.error(error);
                            }
                        });
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
