<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Get form data
    $name = $_POST['fullName'];
    $email = $_POST['userEmail'];
    $message = $_POST['infoMsg'];

    // 2. Set recipient and subject
    $to = "rfurqan009email@gmail.com"; // Change this to your real email
    $subject = "New Contact Form Submission from " . $name;

    // 3. Format the email content
    $body = "Name: $name\nEmail: $email\n\nMessage:\n$message";
    $headers = "From: noreply@yourdomain.com\r\n";
    $headers .= "Reply-To: $email\r\n";

    // 4. Send the email
    if (mail($to, $subject, $body, $headers)) {
        echo "Message sent successfully!";
    } else {
        echo "Failed to send message.";
    }
}
?>
