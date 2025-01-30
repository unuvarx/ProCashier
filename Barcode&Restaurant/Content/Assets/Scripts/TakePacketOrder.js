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
    let customers = [];
    let carriers = [];
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


            $('.categorieBtn').css('border-bottom', '');


            $(this).css('border-bottom', '4px solid cornflowerblue');
        }
        catch (e) {

        }
        
    });


    try {
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

        }
      
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

        }
        
    });
   

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


                        totalAmount += item.productPrice;
                    }
                });
            } else {
                console.error('Addition array is invalid or empty.');
            }

            $('.foot label').text(totalAmount.toFixed(2) + 'TL');
        }
        catch (e) {

        }
        
    }


    $('.personModal .newCustomerBtn').on('click', function () {
        try {
            $('.addNewCustomer').css('display', 'flex');
            $('.editCustomerForm').css('display', 'none');
            $('.personInput input[name="phoneNumberOrNameSurname"]').val("");
            $('.customersInfo').empty();
        }
        catch (e) {

        }
       


    })


    $('.save-btn').on('click', function () {
        try {
            isSaveButtonClicked = true;
            if (addition.length > 0) {
                $('.personModal').css('display', 'flex');
                $.ajax({
                    url: '/PacketOrder/GetCustomers',
                    type: 'GET',
                    dataType: 'json',
                    success: function (response) {
                        customers = response.Customers;
                        carriers = response.Carriers;

                       
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }
                });
            }
        }
        catch (e) {

        }
        ""
    });
    $('#addCustomerForm').submit(function (event) {
        try {
            // Formun normal submit işlemini engelliyoruz
            event.preventDefault();


            // AJAX isteğini gönderiyoruz
            $.post('/PacketOrder/AddNewCustomer', $(this).serialize())
                .done(function (response) {
                    try {
                        customers.push(response.customerInfo);
                        displayCustomerInfo(response.customerInfo.NameSurname);
                        $('.addNewCustomer').hide();
                    }
                    catch (e) {
                        console.error(e);
                    }

                })
                .fail(function (xhr, status, error) {
                    console.error(error);
                });
        }
        catch (e) {

        }
        
    });


    $('.personInput input[name="phoneNumberOrNameSurname"]').on('input', function () {
        try {
            $('.customersInfo').empty();
            const searchTerm = $(this).val().trim().toLowerCase();
            $('.addNewCustomer').css('display', 'none');
            $('.editCustomerForm').css('display', 'none');
            displayCustomerInfo(searchTerm);
        }
        catch (e) {

        }
       
       
    });

    function displayCustomerInfo(searchTerm) {
        try {
            $('.customersInfo').empty();
            searchTerm = searchTerm.trim().toLowerCase();
            let customersFound = false;

            // Müşteri dizisi tanımlı ve boş değilse işlem yap
            if (customers && customers.length > 0) {
                customers.forEach(customer => {
                    // Güvenli bir şekilde özelliklere erişim sağlıyoruz
                    const nameSurname = customer.NameSurname ? customer.NameSurname.toLowerCase().trim() : '';
                    const phoneNumber = customer.PhoneNumber ? customer.PhoneNumber.toString() : '';

                    let carrierOptions = `<option value="">Kurye Seçiniz</option>`;
                    carriers.forEach(carrier => {
                        carrierOptions += `<option value="${carrier.CarrierId}">${carrier.NameSurname}</option>`;
                    });
                    if (searchTerm !== '' && (nameSurname.startsWith(searchTerm) || phoneNumber.startsWith(searchTerm))) {
                        customersFound = true; // En az bir müşteri bulunduğunu işaretleyelim

                        const customerElement = `
                <div class="customer">
                    <input type="hidden" class="customerId" name="customerId" value="${customer.CustomerId}"  />
                    <div class="info">
                        <span id="nameSurname">${customer.NameSurname}</span>
                        <span id="phoneNumber">${customer.PhoneNumber}</span>
                        <span id="adress">${customer.Adress}</span>
                    </div>
                   <div class="selectAndBtns">
                       <div class="process">
                        <select name="carriers">
                        ${carrierOptions}
                        </select>
                        <div class="btns">
                            <button class="editBtn">
                                <i class="fa fa-pencil" aria-hidden="true"></i>
                            </button>
                            <button class="chooseBtn">
                                SEÇ
                            </button>
                        </div>
                       </div>
                        <input type="text" name="customerNote" placeholder="Müşteri Notu" />
                   </div>
                </div>`;

                        $('.customersInfo').append(customerElement);
                    }
                });

                if (!customersFound) {
                    $('.personInput .notFound').text('Müşteri bulunamadı.');
                }
                else {
                    $('.personInput .notFound').text('');
                }
            } 
        }
        catch (e) {

        }
        
    }




    $('.personModal .close-icon').on('click', function () {
        $('.personModal').css('display', 'none');
    });

    $('.customersInfo').on('click', '.chooseBtn', function () {
        try {
            let customerElement = $(this).closest('.customer');
            let customerId = parseInt(customerElement.find('.customerId').val());
            let selectedCarrierId = parseInt(customerElement.find('.selectAndBtns select[name="carriers"]').val());
            let packetOrderId = $('input[name="PacketOrderId"]').val();
            let customerNote = customerElement.find('.selectAndBtns input[name="customerNote"]').val();

            
           


            if (packetOrderId) {
                if (addition.length > 0 && customerId > 0 && selectedCarrierId > 0) {
                    let formData = new FormData();
                    formData.append('CustomerId', customerId);
                    formData.append('CarrierId', selectedCarrierId);
                    formData.append('Orders', JSON.stringify(addition));
                    formData.append('CustomerNote', customerNote);
                    
                    $.ajax({
                        url: `/PacketOrder/UpdatePacketOrder/${packetOrderId}`,
                        type: 'PUT',
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (response) {
                            try {

                                let formData2 = new FormData();
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

                                // print request here
                                let customer = customers.find(c => c.CustomerId === customerId);
                                let carrier = carriers.find(c => c.CarrierId === selectedCarrierId);

                                var now = new Date();
                                var dateTimeString = now.toISOString();
                                let responseUserName = $('input[name="UserName"]').val();
                                let responseOrderDate = dateTimeString;
                                let responseOrders = newAddition;
                                let responseTotalCost = parseFloat(totalCost).toFixed(2);
                                let responseCustomerNameSurname = customer.NameSurname;
                                let responseCustomerPhoneNumber = customer.PhoneNumber;
                                let responseCustomerAdress = customer.Adress;
                                let responseCustomerNote = customerNote;
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
                               
                                        window.location.href = '/PacketOrder/Orders/';
                                    })
                                    .catch(error => {
                                        console.error('Error:', error);
                                    });
                                window.location.href = '/PacketOrder/Orders/';
                            }
                            catch (e) {
                                console.error(e);
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error(error);
                        }
                    });
                }
                else if (!(selectedCarrierId > 0)) {
                    customerElement.find('.selectAndBtns select[name="carriers"]').css('border', '2px solid red');
                }
            }
            else {
                if (addition.length > 0 && customerId > 0 && selectedCarrierId > 0) {
                    let formData = new FormData();
                    formData.append('CustomerId', customerId);
                    formData.append('CarrierId', selectedCarrierId);
                    formData.append('Orders', JSON.stringify(addition));
                    formData.append('CustomerNote', customerNote);

                    $.ajax({
                        url: '/PacketOrder/AddPacketOrder',
                        type: 'POST',
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (response) {
                            try {
                                let formData2 = new FormData();
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
                                

                                // print request here
                                let customer = customers.find(c => c.CustomerId === customerId);
                                let carrier = carriers.find(c => c.CarrierId === selectedCarrierId);

                                var now = new Date();
                                var dateTimeString = now.toISOString();
                                let responseUserName = $('input[name="UserName"]').val();
                                let responseOrderDate = dateTimeString;
                                let responseOrders = newAddition;
                                let responseTotalCost = parseFloat(totalCost).toFixed(2);
                                let responseCustomerNameSurname = customer.NameSurname;
                                let responseCustomerPhoneNumber = customer.PhoneNumber;
                                let responseCustomerAdress = customer.Adress;
                                let responseCustomerNote = customerNote;
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
                                       
                                        window.location.href = '/PacketOrder/Orders/';
                                    })
                                    .catch(error => {
                                        console.error('Error:', error);
                                    });
                                window.location.href = '/PacketOrder/Orders/';

                                
                            }
                            catch (e) {
                                console.error(e);
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error(error);
                        }
                    });
                }
                else if (!(selectedCarrierId > 0)) {
                    customerElement.find('.selectAndBtns select[name="carriers"]').css('border', '2px solid red');
                }
            }
        }
        catch (e) {

        }
        
    });
    $('#customerNameSurname').on('input', function () {
        try {
            // Küçük harfleri büyük harfe dönüştür
            var uppercasedValue = $(this).val().toUpperCase();
            $(this).val(uppercasedValue);
        }
        catch (e) {

        }
        
    });
    $('#editCustomerNameSurname').on('input', function () {
        try {
            // Küçük harfleri büyük harfe dönüştür
            var uppercasedValue = $(this).val().toUpperCase();
            $(this).val(uppercasedValue);
        }
        catch (e) {

        }
        
    });
    $('.customersInfo').on('click', '.editBtn', function () {
        try {
            let customerId = parseInt($(this).closest('.customer').find('.customerId').val());
            var customer = customers.find(c => c.CustomerId === customerId);
            $('.editCustomerForm input[name="editCustomerNameSurname"]').val(customer.NameSurname);
            $('.editCustomerForm input[name="editCustomerPhoneNumber"]').val(customer.PhoneNumber);
            $('.editCustomerForm textarea[name="editCustomerAdress"]').val(customer.Adress);
            $('.personInput input[name="phoneNumberOrNameSurname"]').val("");


            $('.editCustomerForm').css('display', 'flex');
            $('.customersInfo').empty();
            $('#editCustomerForm').submit(function (event) {
                event.preventDefault();

                let formData = new FormData();
                let nameSurname = $('.editCustomerForm input[name="editCustomerNameSurname"]').val();
                let phoneNumber = $('.editCustomerForm input[name="editCustomerPhoneNumber"]').val();
                let adress = $('.editCustomerForm textarea[name="editCustomerAdress"]').val();

                formData.append('CustomerId', customerId);
                formData.append('NameSurname', nameSurname);
                formData.append('PhoneNumber', phoneNumber);
                formData.append('Adress', adress);
                customer.NameSurname = nameSurname;
                customer.PhoneNumber = phoneNumber;
                customer.Adress = adress;
                $.ajax({

                    url: '/PacketOrder/UpdateCustomer',
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        try {
                            $('.customersInfo').empty();
                            customers.filter(c => c.CustomerId !== customerId);
                            displayCustomerInfo(response.customerInfo.NameSurname);
                            $('.editCustomerForm').css('display', 'none');
                        }
                        catch (e) {
                            console.error(e);
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }
                });
            });
        }
        catch (e) {

        }
    });
});
