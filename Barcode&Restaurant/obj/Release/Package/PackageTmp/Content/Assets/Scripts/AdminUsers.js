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
                let statusHtml = user.Status === 1 ?
                    `<div id="active">
                <span>Onaylanmış</span> <i class="fa fa-check" aria-hidden="true"></i>
            </div>` :
                    `<div id="pasive">
                <span>Onaylanmamış</span> <i class="fa fa-times" aria-hidden="true"></i>
            </div>`;

                let actionHtml = user.Status === 0 ?
                    `<button class="checkThisUser" data-user-id="${user.UserId}">Kullanıcıyı Aktif Yap</button>` : '';

                let tr =
                    `<tr>
                <td>${user.Name} </td>
                <td>${user.Username}</td>
                <td>${user.Email}</td>
                <td>${statusHtml}</td>
                <td>
                    ${actionHtml}
                    <a href="/Admin/ChangeUserPassword/${user.UserId}" class="changePassword">Şifre Değiştir</a>
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
            url: '/Admin/GetUsers',
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
    




    $('tbody').on('click', '.checkThisUser', function () {
        try {
            let userId = parseInt($(this).attr('data-user-id'));
            if (confirm('Bu kullanıcıyı aktifleştirmek istediğinize emin misiniz?')) {
                $.ajax({
                    url: `/Admin/MakeActiveUser/${userId}`,
                    type: 'PUT',
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
