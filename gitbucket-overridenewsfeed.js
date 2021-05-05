<script>
// react only on "/" which is News Feed
//console.log($(".container")); // seems does not work here, length: 0
//console.log( $("body > div > div > div").eq(1).children().eq(1) ); // not even this, though it works in console
//console.log( $("body > div > div > div")[1].outerHTML ); // shows parent of above, class .content.body - this very box is inside! No News Feed/Activities in here
//console.log( $("body > div > div > div")[0].prop('outerHTML') );  //cannot
//console.log( $("body > div > div > div").eq(1).children().eq(2) ); // should be class .container - but nope, prob is not even instantiated yet
//console.log( $(document.body)[0].outerHTML ); indeed, no News Feed yet

var show_as = "table"; // or "ulist"
var first_users = ["DEVGROUP"]; // entries in this array go first; set to [] to ignore:

if (location.pathname == "/") {
  //console.log( "In", $("body > div > div > div").eq(1) );
  //$("body > div > div > div").eq(1).append('<p>Hello world</p>'); // Ok, is before News Feed button
  //setTimeout(function() { // ok, after News Feed button, and Activities
  //  $("body > div > div > div").eq(1).append('<p>Hello world again</p>');
  //}, 200);

  baseURL = window.location.protocol + "//" + window.location.host;
  apiURL = baseURL + "/api/v3";
  pubrepos_apiURL = apiURL + "/user/repos";
  //orgrepos_apiURL = apiURL + "/orgs/*/repos"; // cannot use it like this really
  users_apiURL = apiURL + "/users";
  groups_apiURL = apiURL + "/organizations";

  // from https://www.freecodecamp.org/news/javascript-from-callbacks-to-async-await-1cc090ddad99/

  function request(url) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 2000;
      xhr.onreadystatechange = function(e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.response)
          } else {
            reject(xhr.status)
          }
        }
      }
      xhr.ontimeout = function () {
        reject('timeout')
      }
      xhr.open('get', url, true)
      xhr.send();
    })
  }

  const userRequest = request(users_apiURL);
  //const groupsRequest = request(groups_apiURL); //nope, make it a function
  var usersgroups = [];

  //const test_apiURL = apiURL + "/" +"users"+ "/" + "root" + "/repos";
  //request(test_apiURL).then(function(inval){ console.log("test_api", inval); });

  // Just by reading this part out loud you have a good idea of what the code does // moved to onload

  function handleUsersList(users) {
    var tusers = JSON.parse(users);
    tusers.forEach(function delElem(iuser) {
      iuser.ulinktype = "users";
    });
    return tusers;
  }

  function groupsRequest(users) {
    usersgroups = users; // assign to global
    return request(groups_apiURL);
  }

  function handleGroups(groups) {
    //console.log("groups", groups);
    var tgroups = JSON.parse(groups);
    tgroups.forEach(function pushElem(igroup) {
      igroup.ulinktype = "orgs";
      usersgroups.push(igroup);
    });
    //console.log('All users and groups in an array', usersgroups);
    return usersgroups
  }


  function repoRequest(users) {
    // sort here alphabetically first - here we have usersgroups as users:
    users.sort(function(a, b){
      //if(a < b) { return -1; }
      //if(a > b) { return 1; }
      //return 0;
      // case insensitive, SO:8996963:
      return a.login.toLowerCase().localeCompare(b.login.toLowerCase());
    });
    // .. then move the requested users to be first:
    first_users.forEach(function(fuser) {
      //var fidx = users.indexOf(fuser);
      var fidx = users.map(function(e) { return e.login; }).indexOf(fuser); // SO:7176908
      if (fidx > 0) {
        var removed = users.splice(fidx, 1)[0]; // start: fidx, deleteCount=1; returns an array, even for a single element, so extract the element
        var insertidx = 0; // first
        users.splice(insertidx, 0, removed); // inserts at index 0 (or use unshift)
      }
    });
    //console.log("users", users);
    return Promise.all(users.map(function(user) {
      //console.log(user);
      const userrepos_apiURL = apiURL + "/" +user.ulinktype+ "/" + user.login + "/repos";
      return request(userrepos_apiURL)
    }))
  }

  function handleReposList(repos) {
    // NOTE: it seems that the repos list returned here, is automatically sorted by date of last commit descending from the API, nice!
    //repos = JSON.parse(repos); // can't do this
    // turns out, if there are users which are not owners of repositories, we'll end up with extra [] entries in repos - clean them? actually, here "[]" is a string - just handle that below instead
    //repos = repos.filter(value => Object.keys(value).length !== 0);
    //console.log('All users repos in an array', repos)
    var unique = [];
    var distinct_owners = [];
    //var indices_to_delete = [];
    //console.log("repos", JSON.stringify(repos));
    var newrepos = [];
    for( let i = 0; i < repos.length; i++ ){ // SO:15125920
      //console.log("trepo", i, repos[i]);
      var parsedrepo = JSON.parse(repos[i]);
      parsedrepo.forEach(function procrepo(inrepo) {
        //console.log("inrepo", inrepo);
        newrepos.push(inrepo);
      });
    }
    for( let i = 0; i < newrepos.length; i++ ){ // SO:15125920
      var trepo = newrepos[i];
      //if (typeof trepo === 'undefined') {
      //  indices_to_delete.push(i);
      //  continue;
      //}
      if( !unique[trepo.owner.login]){
        distinct_owners.push(trepo.owner.login);
        unique[trepo.owner.login] = 1;
      }
    }

    // find the date of last commit; must search all branches https://stackoverflow.com/questions/9179828/github-api-retrieve-all-commits-for-all-branches-for-a-repo
    // NOTE: there could be no branches in a repo (if it is just created, but not inited); in that case, just [] is returned; else, "master" is returned, even if it is the only one.
    Promise.all(newrepos.map(function(trepo) {
      //console.log(user);
      const branches_apiURL = apiURL + "/repos/" +trepo.owner.login+ "/" + trepo.name + "/branches";
      //console.log("branches_apiURL", branches_apiURL);
      //request(branches_apiURL).then(function(inval){ console.log(inval); });
      return request(branches_apiURL)
    }))
      .then(async function(inmaparr){
        //console.log("inmaparr", inmaparr);
        var numprocd = 0;
        for( let i = 0; i < newrepos.length; i++ ){
          if (inmaparr[i] == "[]") {
            //console.log("[]");
            newrepos[i].last_commit_info = inmaparr[i];
            numprocd++;
          } else {
            var branches_map = JSON.parse(inmaparr[i]);
            Promise.all(branches_map.map(function(inbranch) {
              const commit_apiURL = apiURL + "/repos/" +newrepos[i].owner.login+ "/" + newrepos[i].name + "/commits/" + inbranch.commit.sha;
              //console.log("commit_apiURL", commit_apiURL);
              return request(commit_apiURL)
            }))
              .then(function(inbrarrstr) {
                inbrarr = inbrarrstr.map(JSON.parse);
                // branches_map itself could be a wrong ref here? tbranches_map seems correct
                var tbranches_map = JSON.parse(inmaparr[i]);
                //console.log("i", i, "branches_map", branches_map.length, "tbranches_map", tbranches_map.length, "inbrarr", inbrarr.length);
                for (let ii=0; ii<tbranches_map.length; ii++) {
                  tbranches_map[ii].commit_response = inbrarr[ii];
                }
                //console.log("tbranches_map", tbranches_map);
                // sort by author date, descending
                tbranches_map.sort(function(a, b){
                  if(a.commit_response.commit.author.date < b.commit_response.commit.author.date) { return 1; }
                  if(a.commit_response.commit.author.date > b.commit_response.commit.author.date) { return -1; }
                  return 0;
                });

                function get_last_commit_info_str(newrepoelem, inbrelem) {
                  //console.log(inbrelem);
                  // there is a bug in inbrelem.commit_response.html_url (no / after host); so have to reconstruct
                  let html_commit_url = baseURL + "/" + newrepoelem.owner.login+ "/" + newrepoelem.name + "/commit/";
                  var tstr = inbrelem.commit_response.commit.author.date + ' (commit: <a href="' + html_commit_url + inbrelem.commit_response.sha + '">' + inbrelem.commit.sha.substr(0,7) + '</a> branch: <code>' + inbrelem.name + '</code>)';
                  return tstr;
                }

                //tbranches_map.forEach(function(inbrelem){ console.log(get_last_commit_info_str(newrepos[i], inbrelem)); });

                newrepos[i].last_commit_info = get_last_commit_info_str(newrepos[i], tbranches_map[0]);
                numprocd++;
              });
          }
        } // end for
        //return newrepos; // must have this for correct sync?! Only the [] are correct here!
        // crappy workaround to wait for all results, since hard to find the right thing to do in JS:
        while (numprocd < newrepos.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
          //console.log("numprocd", numprocd);
          if (numprocd == newrepos.length) {
            return newrepos;
          }
        }
      })
      .then( function(innewrepos) { // this executes later than the rest of the code after; so place final printout stage in this handler!
        //console.log("newrepos", JSON.stringify(newrepos));
        newrepos = innewrepos;
        //console.log("newrepos", JSON.stringify(newrepos));

        repolist_str = "<div>Repos per owner, with last update:\n";
        if (show_as == "ulist") {
          repolist_str += "<ul>\n";
        } else { // show_as == "table"
          $("<style type='text/css'> .mytable td {  padding:0px; padding-left: 10px; } </style>").appendTo("head");
          repolist_str += '<table class="mytable">\n';
          repolist_str += "  <tr><td colspan='3'><hr/></td></tr>\n";
        }
        distinct_owners.forEach(function callbackFn(currentOwner) {
          if (show_as == "ulist") {
            repolist_str += "  <li> "+currentOwner+"\n";
          } else { // show_as == "table"
            //repolist_str += "  <tr><td>"+currentOwner+"</td>"; // nothing here
          }
          var curownerrepos_str = "";
          var currentownermentioned = false;
          newrepos.forEach( function repoiter(currepo) {
            var tcurrepo = currepo; //JSON.parse(currepo)[0];
            var repostr = "";
            if (tcurrepo.owner.login == currentOwner) {
              if (show_as == "ulist") {
                repostr = '    <li> <a href="'+tcurrepo.html_url+'">'+ tcurrepo.name +"</a></li>\n";
              } else { // show_as == "table"
                var tcurrentOwner = "";
                if (currentownermentioned == false) {
                  tcurrentOwner = currentOwner;
                  currentownermentioned = true;
                }
                //console.log("tcurrepo", JSON.stringify(tcurrepo));
                repostr = "  <tr><td>"+tcurrentOwner+'</td><td>&bull; <a href="'+tcurrepo.html_url+'">'+ tcurrepo.name +"</a></td><td>" +tcurrepo.last_commit_info+ "</td></tr>\n";
              }
            }
            if (repostr != "") {
              curownerrepos_str += repostr;
            }
          });
          if (curownerrepos_str != "") {
            if (show_as == "ulist") {
              curownerrepos_str = "  <ul>\n" + curownerrepos_str + "  </ul>\n";
            } else { // show_as == "table"
              // add horizontal line
              curownerrepos_str += "  <tr><td colspan='3'><hr/></td></tr>\n";
            }
          }
          repolist_str += curownerrepos_str;
        });

        if (show_as == "ulist") {
          repolist_str += "</ul>\n";
        } else { // show_as == "table"
          repolist_str += "</table>\n";
        }

        // append repolist_str as a sibling node after the nav-tabs:
        $("body > div > div > div ul.nav.nav-tabs").after(repolist_str); // ok, after News Feed button, but before Activities


      });

    //// clear `repos` from undefined/empty // no need with newrepos
    //indices_to_delete.forEach(function delElem(idx) {
    //  repos.splice(idx, 1);
    //});
    //repolist_str = "<div>Repos per owner:\n"; //moved up now
  }

  function handleErrors(error) {
    console.error('Something went wrong ', error)
  }

  $(window).on('load', function(){ // may fire before 200 ms setTimeout! // ok, after News Feed button, and Activities
    //
    //dom not only ready, but everything is loaded
    //console.log( $("body > div > div > div").eq(1) );
    //console.log( $("body > div > div > div ul.nav.nav-tabs") );
    //$("body > div > div > div").eq(1).append('<p>Hello world third</p>'); // ok, after News Feed button, and Activities
    //$("body > div > div > div ul.nav.nav-tabs").after('<p>Hello world third</p>'); // ok, after News Feed button, but before Activities

    // Just by reading this part out loud you have a good idea of what the code does
    userRequest
    .then(handleUsersList)
    .then(groupsRequest)
    .then(handleGroups)
    .then(repoRequest)
    .then(handleReposList) // append to body here
    .catch(handleErrors)

  });
}
// close information box
$(".close").click();
</script>