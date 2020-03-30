const express = require("express");
const bodyParser = require("express");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();

app.set('view engine', "ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-nico:ahezabub@cluster0-dosu7.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

// Formato y modelo de Mongo
const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);
// end



// Items default
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];
// end

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){

// Encuentra items de la collection "Items" y lo guarda en foundItems
  Item.find({}, function(err, foundItems){
// Valida si hay items o no
    if (foundItems.length === 0){
// Carga todos los items default en la DB y redirecciona
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        }else{
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/")
    } else {
  // Hace render de todos los foundItems si no esta vacio
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems,
      });
    }
  });
});

app.get("/:customListName", function(req, res){
  const customListName = lodash.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if(!foundList){
        //Create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);

      }else{
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        })
      }
    }
  });



})

app.post("/", function(req, res){
// Items content
  const itemName = req.body.newItem;
  const listName = req.body.list;
// Le da a itemName el formato de la DB y lo guarda en item
  const item = new Item ({name: itemName});

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + foundList.name);
    })
  }
// Guarda el item en la DB

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }


});


app.get("/about", function(req, res){
  res.render("about");
})


let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}
app.listen(port, function(){
  console.log("Server started successfully");
});
