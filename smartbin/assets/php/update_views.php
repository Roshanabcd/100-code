<?php
$sql = "UPDATE videos SET `views`= views+1 WHERE `short_url` = '{$_GET['v']}'";
$result = mysqli_query($con,$sql);

?>