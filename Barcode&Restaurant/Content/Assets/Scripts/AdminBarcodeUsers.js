$(document).ready(function () {
    let Users = [];
    let currentPage = 1; // Başlangıçta gösterilen sayfa numarası
    const itemsPerPage = 10; // Her sayfada gösterilecek tr sayısı

   
    function createPaginationButtons(totalPages, currentPage) {
        try {
            const maxButtons = 7; // Gösterilecek maksimum buton sayısı

            let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);

            if (endPage - startPage < maxButtons - 1) {
                startPage = Math.max(1, endPage - maxButtons + 1);
            }

            let paginationHtml = '';
            if (startPage > 1) {
                paginationHtml += '<button class="pageButton" data-page="1">1</button>';
                if (startPage > 2) {
                    paginationHtml += '<span>...</span>';
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += `<button class="pageButton ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    paginationHtml += '<span>...</span>';
                }
                paginationHtml += `<button class="pageButton" data-page="${totalPages}">${totalPages}</button>`;
            }

            $('.pagination').html(paginationHtml);
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Sayfa değiştirme işlemleri
    $(document).on('click', '.pageButton', function () {
        try {
            currentPage = parseInt($(this).attr('data-page'));
            showUsers(currentPage);
        }
        catch (e) {
            console.error(e);
        }
        
    });

    // Kullanıcı arama işlemi
    $('input[name="findUser"]').on('input', function () {
        try {
            let searchText = $(this).val().trim().toLowerCase();
            let filteredUsers = [];

            if (searchText === '') {
                filteredUsers = Users;
            } else {
                filteredUsers = Users.filter(user => {
                    return user.Name.toLowerCase().includes(searchText) ||
                        user.Username.toLowerCase().includes(searchText);
                });
            }

            showUsers(1, filteredUsers);
        }
        catch (e) {
            console.error(e);
        }
        
    });

  
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

    function showUsers(page, users) {
        try {
            let startIndex = (page - 1) * itemsPerPage;
            let endIndex = startIndex + itemsPerPage;
            let displayedUsers = [];

            if (users) {
                displayedUsers = users.slice(startIndex, endIndex);
            } else {
                displayedUsers = Users.slice(startIndex, endIndex);
            }

            $('tbody').empty();
            displayedUsers.forEach(user => {




                let statusHtml = user.PacketStatus ?
                    `<div id="active">
                <span>Aktif</span> <i class="fa fa-check" aria-hidden="true"></i>
            </div>` :
                    `<div id="pasive">
                <span>Pasif</span> <i class="fa fa-times" aria-hidden="true"></i>
            </div>`;
                let tr =
                    `<tr>
                <td>${user.Name} </td>
                <td>${user.Username}</td>
                <td>${user.Email}</td>
                <td>${statusHtml}</td>
                <td>${formatDate(user.RemainingUsageTime)}</td>
                <td class="timeBtns">
                   <button class="plusOneYear plus" data-user-id="${user.UserId}">+1 Yıl</button> 
                   <button class="plusSixMonths plus" data-user-id="${user.UserId}">+6 Ay</button> 
                   <button class="minesOneYear mines" data-user-id="${user.UserId}">-1 Yıl</button> 
                   <button class="minesSixMonths mines" data-user-id="${user.UserId}">-6 Ay</button> 
                   
                </td>
            </tr>`;

                $('tbody').append(tr);
            });

            if (users) {
                createPaginationButtons(Math.ceil(users.length / itemsPerPage), page);
            } else {
                createPaginationButtons(Math.ceil(Users.length / itemsPerPage), page);
            }
        }
        catch (e) {
            console.error(e);
        }

        
    }



    try {
        $.ajax({
            url: '/Admin/GetBarcodeUsers',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                Users = response;
                showUsers(currentPage, Users);
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }
    
    




    
    $('tbody').on('click', '.plusOneYear', function () {
        try {
            let userId = parseInt($(this).attr('data-user-id'));

            let formData = new FormData();
            formData.append('type', 0);
            if (confirm('Bu kullanıcıya 1 yıl eklemek istediğinize emin misiniz?')) {
                $.ajax({
                    url: `/Admin/IncreaseOneYear/${userId}`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
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
    $('tbody').on('click', '.plusSixMonths', function () {
        try {
            let userId = parseInt($(this).attr('data-user-id'));
            let formData = new FormData();
            formData.append('type', 0);
            if (confirm('Bu kullanıcıya 6 ay eklemek istediğinize emin misiniz?')) {
                $.ajax({
                    url: `/Admin/IncreaseSixMonths/${userId}`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
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
    $('tbody').on('click', '.minesOneYear', function () {
        try {
            let userId = parseInt($(this).attr('data-user-id'));
            let formData = new FormData();
            formData.append('type', 0);
            if (confirm('Bu kullanıcıdan 1 yıl çıkarmak istediğinize emin misiniz?')) {
                $.ajax({
                    url: `/Admin/DecreaseOneYear/${userId}`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
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
    $('tbody').on('click', '.minesSixMonths', function () {
        try {
            let userId = parseInt($(this).attr('data-user-id'));
            let formData = new FormData();
            formData.append('type', 0);
            if (confirm('Bu kullanıcıdan 6 ay çıkarmak istediğinize emin misiniz?')) {
                $.ajax({
                    url: `/Admin/DecreaseSixMonths/${userId}`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
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
});
