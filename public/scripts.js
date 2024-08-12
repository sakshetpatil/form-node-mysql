$(document).ready(function() {
    $.ajax({
        url: '/user',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
           // alert(data);
           //alert('hi');
            $('#username').text(data.username);
            $('#email').text(data.email);
            $('#gender').text(data.gender);
            $('#address').text(data.address);
            $('#mobile').text(data.mobile);
            $('#education').text(data.education);
            $('#dob').text(data.dob);
            $('#userPhoto').attr('src', data.photo_path);
            $('#resumeLink').attr('href', data.resumePath);
           $('#hobbies').text(data.hobbies.split(',').join(', '));
           
            
        },
        error: function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login.html';
            } else {
                console.error('Error fetching users:', xhr.responseText);
            }
        }
            
    });
});
