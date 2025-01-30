$(document).ready(function () {

    $('#barcode').focus();

    // Sayfa odak kaybını takip etme
    
    $('#barcode').on('input', function () {
        try {
            $(this).val($(this).val().replace(/[^\d]/g, ''));
        }
        catch (e) {
            console.error(e);
        }

   
    });
    $('#paid').on('input', function () {
        try {
            let value = $(this).val();

            $(this).val(value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.?\d{0,2}).*/, '$1'));
            updateChange();
        }
        catch (e) {
            console.error(e);
        }
        
    });
    $('#addProductForm').on('submit', function (e) {
        try {
            e.preventDefault();

            var formData = {
                barcode: $('#modalBarcode').val(),
                name: $('#modalName').val(),
                price: $('#modalPrice').val()
            };

            $.ajax({
                url: '/Barcode/AddProductReqFromSelling',
                type: 'POST',
                data: formData,
                success: function (response) {

                    $.ajax({
                        url: '/Barcode/GetProducts',
                        type: 'GET',
                        dataType: 'json',
                        success: function (response) {
                            allProducts = response;
                            addProduct(allProducts, addedProducts, formData.barcode);
                            $('#modalBarcode').val("")
                            $('#modalName').val("")
                            $('#modalPrice').val("")
                            $('.AddProductModal').removeClass('flex');
                        },
                        error: function (xhr, status, error) {
                            console.error(error);
                        }
                    });
                },
                error: function (xhr, status, error) {
                    console.error("Ürün eklenirken bir hata oluştu: " + error);
                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('#modalName').on('input', function () {
        try {
            // Küçük harfleri büyük harfe dönüştür
            var uppercasedValue = $(this).val().toUpperCase();
            $(this).val(uppercasedValue);
        }
        catch (e) {
            console.error(e);
        }
       
    });
    var allProducts = [];
    var addedProducts = [];


    try {
        $.ajax({
            url: '/Barcode/GetProducts',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                allProducts = response;
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }
    
    $(window).on('beforeunload', function (e) {
        try {
            if (addedProducts.length > 0) {
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

    $('.printBtn').on('click', function () {

        try {
            
            let arr = [];
            let cost = 0;
            addedProducts.map((item) => {
                cost = parseFloat((parseFloat(item.Cost) + parseFloat(cost)).toFixed(2));
                arr.push({
                    Name: item.Name.length > 10
                        ? item.Name.substring(0, 10) + '..'
                    : item.Name,
                    Amount: item.Amount.toString(),
                    Price: parseFloat(item.NewPrice).toFixed(2),
                })
            })

            // print request here
            let formData = new FormData();
            formData.append('Products', JSON.stringify(arr))
            formData.append('Cost', cost.toString())
            var now = new Date();
            var dateTimeString = now.toISOString();

            let responseUserName = $('input[name="UserName"]').val();
            let responseOrderDate = dateTimeString;
            let responseProducts = arr;
            let responseCost = cost.toString();
            let orderDATA = {
                UserName: responseUserName,
                OrderDate: responseOrderDate,
                Products: responseProducts,
                Cost: responseCost
            }

            fetch('http://localhost:8081/printbarcode', {
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
        }
    })
    $('#barcode').on('keydown', function (event) {
        try {
            if (event.which === 13) { // Enter tuşunun ASCII kodu
                var barcode = $('#barcode').val();
                if (barcode.length > 0) {
                    addProduct(allProducts, addedProducts, barcode);
                    $('#barcode').val('');
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });
    $('.searchProduct').on('click', function () {
        try {
            var barcode = $('#barcode').val();
            if (barcode.length > 0) {
                addProduct(allProducts, addedProducts, barcode);
                $('#barcode').val('');
            }
        }
        catch (e) {
            console.error(e);
        }
        
        
    });

    $('.tableBody').on('click', '.increaseBtn', function () {
        try {
            var barcode = $(this).closest('tr').find('td:eq(1)').text();
            increase(barcode, addedProducts);
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('.tableBody').on('click', '.decreaseBtn', function () {
        try {
            var barcode = $(this).closest('tr').find('td:eq(1)').text();
            decrease(barcode, addedProducts);
        }
        catch (e) {
            console.error(e);
        }
        
    });
    $('.tableBody').on('click', '.x', function () {
        try {
            var barcode = $(this).closest('tr').find('td:eq(1)').text();
            removeProduct(barcode, addedProducts);
        }
        catch (e) {
            console.error(e);
        }
        
    });

    $('.tableHead').on('click', '.trash', function () {
        try {
            clearAddedProducts();
        }
        catch (e) {
            console.error(e);
        }
        
    });
    $(document).on('keydown', function (event) {
        try {
            if (event.which === 27) {
                $('.AddProductModal').removeClass('flex');
            }
        }
        catch (e) {
            console.error(e);
        }
        
    });
    $('.AddProductModal').on('click', '.exitModal', function () {
        try {
            $('.AddProductModal').removeClass('flex');
        }
        catch (e) {
            console.error(e);
        }
        
    });
    $('.tableBody').on('change', '.isUpdateInput', function () {
        try {
            var isChecked = $(this).is(':checked');
            var barcode = $(this).closest('tr').find('td:eq(1)').text();
            updateIsUpdate(barcode, addedProducts, isChecked);
        }
        catch (e) {
            console.error(e);
        }
       
    });
    $(document).on('keydown', function (event) {
        try {
            if (event.which === 119) { // 119, F8 tuşunun ASCII kodudur.
                $('.completeSell .cashPaid').trigger('click');
            }
            else if (event.which === 120) { // 120, F9 tuşunun ASCII kodudur.
                $('.completeSell .cardPaid').trigger('click');
            }
        }
        catch (e) {
            console.error(e);
        }
       
    });
        $('.completeSell').on('click', '.cashPaid', function () {
            try {
                let products = addedProducts;
                let productsStr = JSON.stringify(addedProducts);
                if (addedProducts.length > 0) {
                    $.ajax({
                        url: '/Barcode/CompleteTheSell',
                        type: 'POST',
                        data: { totalCost: $('#cost').val(), products: products, productsStr: productsStr, cashPaid: $('#cost').val(), cardPaid: "0"  },
                        success: function (response) {
                            clearAddedProducts();
                            $('.SuccessMessageModal').fadeIn(500);

                            setTimeout(function () {
                                $('.SuccessMessageModal').fadeOut(500);
                            }, 3000)




                        },
                        error: function (xhr, status, error) {

                            $('.ErrorMessageModal').fadeIn(500);
                            setTimeout(function () {
                                $('.ErrorMessageModal').fadeOut(500);
                            }, 3000)

                        }
                    });
                }
            }
            catch (e) {
                console.error(e);
            }
        });
    $('.completeSell').on('click', '.cardPaid', function () {
        try {
            let products = addedProducts;
            let productsStr = JSON.stringify(addedProducts);
            if (addedProducts.length > 0) {
                $.ajax({
                    url: '/Barcode/CompleteTheSell',
                    type: 'POST',
                    data: { totalCost: $('#cost').val(), products: products, productsStr: productsStr, cashPaid: "0", cardPaid: $('#cost').val() },
                    success: function (response) {
                        
                        clearAddedProducts();
                        $('.SuccessMessageModal').fadeIn(500);

                        setTimeout(function () {
                            $('.SuccessMessageModal').fadeOut(500);
                        }, 3000)
                        
                    },
                    error: function (xhr, status, error) {

                        $('.ErrorMessageModal').fadeIn(500);
                        setTimeout(function () {
                            $('.ErrorMessageModal').fadeOut(500);
                        }, 3000)

                    }
                });
            }
        }
        catch (e) {
            console.error(e);
        }
    });
    




    const updateChange = () => {
        try {
            var paid = parseFloat($('#paid').val());
            var cost = parseFloat($('#cost').val());

            if (!isNaN(paid) && !isNaN(cost)) {
                var change = paid - cost;
                $('#change').val(change.toFixed(2));
            } else {
                $('#change').val('');
            }
        }
        catch (e) {
            console.error(e);
        }
        
    };

    const showTr = (addedProducts) => {

        try {
            $(".tableBody").empty();
            addedProducts.forEach(function (product) {
                var productHTML = `
                <tr>
                    <td><button class="x"><img src="../Content/Assets/Images/x.jpg" alt="Alternate Text" /></button></td>
                    <td>${product.Barcode}</td>
                    <td>${product.Name}</td>
                    <td><button class="decreaseBtn">-</button> <input autocomplete="off" class="amountInput" type="text" name="amount" value="${product.Amount}" /> <button class="increaseBtn">+</button></td>
                    <td><input autocomplete="off" type="text" placeholder="00.00" class="priceInput" name="priceInput" value="${product.NewPrice}" /></td>
                    <td><input disabled type="text" class="costInput" name="costInput" value="${product.Cost}" /></td>
                    <td><input type="checkbox" class="isUpdateInput" name="isUpdate" ${product.IsUpdate ? 'checked' : ''} /></td>
                </tr>
            `;
                $(".tableBody").append(productHTML);
            });

            // Event listeners
            $('.tableBody').find('.priceInput').on('input', function () {
                var barcode = $(this).closest('tr').find('td:eq(1)').text();
                let value = $(this).val();

                $(this).val(value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.?\d{0,2}).*/, '$1'));
                changePrice($(this), addedProducts, barcode);
                calculateCost(addedProducts);
            });

            $('.tableBody').find('.amountInput').on('input', function () {
                var barcode = $(this).closest('tr').find('td:eq(1)').text();
                changeAmount($(this), addedProducts, barcode);
                calculateCost(addedProducts);
            });
        } catch (error) {
            console.error(error);
        }
    };

    const addProduct = (allProducts, addedProducts, barcode) => {
        try {
            var beepElement = $('#beep')[0];
            var notFoundElement = $('#notFound')[0];
            var foundAddedProduct = addedProducts.find(x => x.Barcode === barcode);
            if (foundAddedProduct) {
                foundAddedProduct.Amount += 1;
                beepElement.play().catch(function (error) {
                    
                });
            } else {
                var foundProduct = allProducts.find(x => x.Barcode === barcode);
                if (foundProduct) {
                    if (foundProduct.IsUpdate === false) {
                        foundProduct.NewPrice = foundProduct.Price;
                    } else {
                        foundProduct.Price = foundProduct.NewPrice;
                    }
                    foundProduct.Amount = 1;
                    foundProduct.Cost = foundProduct.Price * foundProduct.Amount;
                    addedProducts.push(foundProduct);
                    beepElement.play().catch(function (error) {

                    });
                } else {
                    notFoundElement.play().catch(function (error) {
                        console.error(error);
                    });
                    $('.AddProductModal').addClass('flex');
                    $('#modalBarcode').val(barcode);
                    $('#modalPrice').on('input', function () {
                        let value = $(this).val();

                        $(this).val(value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d*\.?\d{0,2}).*/, '$1'));
                        updateChange();
                    });
                }
            }
            showTr(addedProducts);
            calculateCost(addedProducts);
            
        } catch (error) {
            console.error(error);
        }
    };

    const increase = (barcode, addedProducts) => {
        try {
            var foundProduct = addedProducts.find(x => x.Barcode === barcode);
            if (foundProduct) {
                foundProduct.Amount += 1;
                foundProduct.Cost = foundProduct.NewPrice * foundProduct.Amount;
                showTr(addedProducts);
                calculateCost(addedProducts);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const decrease = (barcode, addedProducts) => {
        try {
            var foundProduct = addedProducts.find(x => x.Barcode === barcode);
            if (foundProduct) {
                if (foundProduct.Amount > 1) {
                    foundProduct.Amount -= 1;
                    foundProduct.Cost = foundProduct.NewPrice * foundProduct.Amount;
                    showTr(addedProducts);
                    calculateCost(addedProducts);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const changePrice = (input, addedProducts, barcode) => {
        try {
            var value = input.val();

            var validValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            input.val(validValue);

            if (validValue === '') return;

            var newPrice = parseFloat(validValue);
            var costInput = input.closest('tr').find('.costInput');
            var amount = parseInt(input.closest('tr').find('.amountInput').val());
            var newCost = newPrice * amount;
            costInput.val(newCost);

            var foundProduct = addedProducts.find(x => x.Barcode === barcode);
            if (foundProduct) {
                
                foundProduct.NewPrice = newPrice;
                
                foundProduct.Cost = newCost;
            }
        } catch (error) {
            console.error(error);
        }
    };
    const changeAmount = (input, addedProducts, barcode) => {
        try {
            var value = input.val();
            var validValue = value.replace(/[^\d]/g, '');
            input.val(validValue);

            if (validValue === '') return;

            var amount = parseInt(validValue);
            var priceInput = input.closest('tr').find('.priceInput');
            var newPrice = parseFloat(priceInput.val());
            var newCost = newPrice * amount;

            // Update amount and cost in addedProducts
            var foundProduct = addedProducts.find(x => x.Barcode === barcode);
            if (foundProduct) {
                foundProduct.Amount = amount;
                foundProduct.Cost = newCost;
            }

            // Update cost input value in the table row
            input.closest('tr').find('.costInput').val(newCost.toFixed(2));
        } catch (error) {
            console.error(error);
        }
    };



    const calculateCost = (addedProducts) => {
        try {
            var totalCost = 0;
            addedProducts.forEach((product) => {
                product.Cost = product.NewPrice * product.Amount;
                totalCost += parseFloat(product.Cost);
            });
            $('#cost').val(totalCost.toFixed(2));
            updateChange();
        } catch (error) {
            console.error(error);
        }
    };


    const removeProduct = (barcode, addedProducts) => {
        try {
            var productIndex = addedProducts.findIndex(x => x.Barcode === barcode);
            if (productIndex > -1) {
                addedProducts.splice(productIndex, 1);
                showTr(addedProducts);
                calculateCost(addedProducts);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const clearAddedProducts = () => {
        try {
            addedProducts = [];
            showTr(addedProducts);
            calculateCost(addedProducts);
            $('#barcode').val('');
            $('#paid').val('');
            $('#change').val('');
        } catch (error) {
            console.error(error);
        }
    };
});

const updateIsUpdate = (barcode, addedProducts, isChecked) => {
    try {
        var foundProduct = addedProducts.find(x => x.Barcode === barcode);
        if (foundProduct) {
            foundProduct.IsUpdate = isChecked;
        }
    } catch (error) {
        console.error(error);
    }
};