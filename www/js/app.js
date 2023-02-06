/**
 * cordova create [folder] [packagename] [app name]
 *
 * cordova platform add ios
 * cordova platform add android
 *
 * cordova plugin add cordova-plugin-camera --variable CAMERA_USAGE_DESCRIPTION="your usage message"  --variable PHOTOLIBRARY_USAGE_DESCRIPTION="your usage message"
 * cordova plugin add cordova-plugin-file
 *
 * navigator.camera.getPicture(success, fail, options)
 * success(fileuri)
 *
 * resolveLocalFileSystemURL(path, success, fail)
 *
 * success returns either
 * directoryEntry
 *  .getDirectory(name, {create:true}, success, fail)
 *  .getFile("newFile.txt", {create: true}, success, fail)
 * fileEntry
 *  .isFile
 *
 * which inherit from
 * Entry
 * .nativeURL - absolute device OS path to file. entry.toURL() method
 * .fullPath - relative to the HTML root
 * .toInternalURL() - returns a cdvfile:// path
 *    Add <access origin="cdvfile://*" /> to config.xml
 *    Add cdvfile: to your Content-Security-Policy
 * .name
 * .type
 * .copyTo()
 * .remove()
 *
 * cordova.file.dataDirectory - save your permanent files here
 * cordova.file.applicationDirectory + "www/" - your www folder for your Cordova project
 *
 * https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/index.html
 * https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html
 *
 * Error Codes for Files
 * https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html#list-of-error-codes-and-meanings
 * Writing to a file
 * https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html#write-to-a-file
 */

const app = {
  tempURL: null,
  permFolder: null,
  oldFile: null,
  permFile: null,
  KEY: "OLDfileNAMEkey",
  init: () => {
    setTimeout(function () {
      console.log("File system/plugin is ready");
      app.addListeners();
      //create the folder where we will save files
      app.getPermFolder();
    }, 2000);
  },
  addListeners: () => {
    document.getElementById("btnCam").addEventListener("click", app.takePic);
    document.getElementById("btnFile").addEventListener("click", app.copyImage);
  },

  getPermFolder: () => {
    let path = cordova.file.dataDirectory;
    let path2 = cordova.file.externalApplicationStorageDirectory;
    document.getElementById("msg").textContent = path2;

    //save the reference to the folder as a global app property
    resolveLocalFileSystemURL(
      path2,
      (dirEntry) => {
        //create the permanent folder
        dirEntry.getDirectory(
          "images",
          { create: true },
          (permDir) => {
            app.permFolder = permDir;
            console.log("Created or opened", permDir.nativeURL);
            document.getElementById("permlocation").textContent =
              permDir.nativeURL.toString();
            //check for an old image from last time app ran
            app.loadOldImage();
          },
          (err) => {
            console.warn("failed to create or open permanent image dir");
            document.getElementById("mpermlocationsg").textContent = "no dir";
          }
        );
      },
      (err) => {
        console.warn("We should not be getting an error yet");
        document.getElementById("permlocation").textContent = "error";
      }
    );
  },
  loadOldImage: () => {
    //check localstorage to see if there was an old file stored
    let oldFilePath = localStorage.getItem(app.KEY);
    //if there was an old file then load it into the imgFile
    if (oldFilePath) {
      resolveLocalFileSystemURL(
        oldFilePath,
        (oldFileEntry) => {
          app.oldFileEntry = oldFileEntry;
          let img = document.getElementById("imgFile");
          img.src = oldFileEntry.nativeURL;
        },
        (err) => {
          console.warn(err);
        }
      );
    }
  },
  takePic: (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    let options = {
      quality: 80,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: false,
      encodingType: Camera.EncodingType.JPEG,
      mediaType: Camera.MediaType.PICTURE,
      targetWidth: 400,
      targetHeight: 400,
    };
    console.log(options);
    navigator.camera.getPicture(app.gotImage, app.failImage, options);
  },
  gotImage: (uri) => {
    app.tempURL = uri;
    document.getElementById("imgurl").textContent = uri.toString();
    //document.getElementById("imgCamera").src = uri; //need to add tostring??
    // var elem = document.getElementById("imgCamera");
    // elem.src = uri.toURL();
  },
  failImage: (err) => {
    console.warn(err);
  },
  copyImage: (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    //copy the temp image to a permanent location
    let fileName = Date.now().toString() + ".jpg";

    resolveLocalFileSystemURL(
      app.tempURL,
      (entry) => {
        //we have a reference to the temp file now
        console.log(entry);
        console.log("copying", entry.name);
        console.log(
          "copy",
          entry.name,
          "to",
          app.permFolder.nativeURL + fileName
        );
        //copy the temp file to app.permFolder
        entry.copyTo(
          app.permFolder,
          fileName,
          (permFile) => {
            //the file has been copied
            //save file name in localstorage
            let path = permFile.nativeURL;
            localStorage.setItem(app.KEY, path);
            app.permFile = permFile;
            console.log(permFile);
            console.log("add", permFile.nativeURL, "to the 2nd image");
            document.getElementById("copiedto").textContent =
              permFile.nativeURL.toString();
            document.getElementById("imgFile").src = permFile.toURL();
            //delete the old image file in the app.pecordovarmFolder
            if (app.oldFile !== null) {
              app.oldFile.remove(
                () => {
                  console.log("successfully deleted old file");
                  //save the current file as the old file
                  app.oldFile = permFile;
                },
                (err) => {
                  console.warn("Delete failure", err);
                }
              );
            }
          },
          (fileErr) => {
            console.warn("Copy error", fileErr);
          }
        );
      },
      (err) => {
        console.error(err);
      }
    );
  },
};
const ready = "cordova" in window ? "deviceready" : "DOMContentLoaded";
document.addEventListener(ready, app.init);
