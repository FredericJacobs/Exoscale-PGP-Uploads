if (typeof(openpgp) == "undefined") {
  console.log("ERROR: OpenPGP is not defined");
}

function uploadFileAdapter (evt) {
  file = evt.target.files[0];
  uploadFile(evt.target.files[0]);
}

function uploadFile(file) {
  return new Promise(
    function(resolve, reject) {
      if (file.constructor.name != "File") {
        reject("ERROR: The expected type is \"File\". Got \""
              + file.constructor.name + "\| instead.");
        return;
      }

      keyRetreival.then(function(publicKey) {
        var readingUpload = [encryptDocument(file, publicKey), requestUploadToken(file)];
        return Promise.all(readingUpload);
      }).then(function(values) {
        return objStorageUpload(values[0],  file.type ,values[1]);
      });
    }
  );
};

function requestUploadToken(file) {
  return new Promise(
    function(resolve, reject) {
      var content_type = file.type;
      var client = new XMLHttpRequest();
      client.open('GET', "token/?contentType="+ encodeURIComponent("application/pgp-encrypted; charset=UTF-8"));

      client.onreadystatechange = function() {
        if (client.readyState != 4) {
          return;
        }

        if (client.status == 200) {
          console.log("Debug ==>  Signed URL: " + client.responseText);
          resolve(client.responseText);
        } else {
          reject("Error: Upload to Object Storage failed and returned status code " +
            client.status + " " + client.statusText);
        }
      }

      client.send();
    }
  )
}

function objStorageUpload (ciphertext, contentType, uploadURL){
  return new Promise(
    function(resolve, reject) {
      var client = new XMLHttpRequest();
      client.open('PUT', uploadURL)
      client.setRequestHeader("Content-Type", "application/pgp-encrypted; charset=UTF-8");
      client.onreadystatechange = function() {
        if (client.readyState != 4) {
          return;
        }

        if (client.status == 200) {
          resolve();
        } else {
          reject("Error: Upload to Object Storage failed and returned status code " +
            client.status + " " + client.statusText);
        }
      }

      client.send(ciphertext);
    }
  );
}

function encryptDocument(file, publicKey) {
  return new Promise(
    function(resolve, reject) {
      var pk  = openpgp.key.readArmored(publicKey);
      var reader = new FileReader();

      reader.onload = (function(theFile) {
        return function(e) {
          var fileData = e.target.result;
          var msg      = openpgp.message.fromBinary(fileData);
          var errors   = pk.err || msg.err;

          if (typeof(errors) != 'undefined'){
            reject("Error: An error occured while preparing encryption: " + errors);
          } else {
            try {
              var ciphertext = openpgp.armor.encode(openpgp.enums.armor.message, msg.encrypt(pk.keys).packets.write());
              resolve(ciphertext);
            } catch(err) {
              reject("Error: An error occured while encrypting: " + err);
            }
          }
        };
      })(file);

      reader.readAsBinaryString(file);
    }
  )
}

// Key can be fetched on load.
var keyRetreival = new Promise(
  function(resolve, reject) {
    var client = new XMLHttpRequest();
    client.open('GET', 'pk.txt'); // This line will have probably to be adapted to reflect the path where the public key was uploaded with the website assets.

    client.onreadystatechange = function() {
      if (client.readyState != 4) {
        return;
      }

      if (client.status == 200) {
        resolve(client.responseText);
      } else {
        reject("Error: Key Retreival failed returning status code " +
          client.status + " " + client.statusText);
      }
    }
    client.send();
  }
);
