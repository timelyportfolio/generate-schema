library(V8)

ct <- new_context()

ct$eval('var NA = null;')
ct$source( './src/json_schema.js' )

sch <- ct$get(
  sprintf(
    'schemaJson("%s",%s)'
    ,'mtcars_spec'
    ,jsonlite::toJSON(mtcars,dataframe="rows",auto_unbox=T)
  )
)

library(htmltools)
tl <- browsable(
  tagList(
    tags$head(
      tags$script(src="https://cdnjs.cloudflare.com/ajax/libs/json-editor/0.7.28/jsoneditor.js")
    ),
    tags$div(id="editor-holder"),
    tags$script(
      HTML(
sprintf(
'
var schema = %s;
var element = document.getElementById("editor-holder");
var editor = new JSONEditor(
  element,
  {
    "schema": schema,
    "startval": %s,
    "theme": "bootstrap3",
    "iconlib": "fontawesome4"
  }
);
',
jsonlite::toJSON(sch, auto_unbox=TRUE),
jsonlite::toJSON(mtcars, auto_unbox=TRUE, dataframe="rows")
)        
      )
    ),
    rmarkdown::html_dependency_jquery(),
    rmarkdown::html_dependency_bootstrap(theme="default"),
    rmarkdown::html_dependency_font_awesome()
  )
)

tl


### try with mozilla-services react-json-form

library(reactR)
library(htmltools)
library(pipeR)

dep_reactform <- htmlDependency(
  name = "react-jsonschema-form",
  version = "0.41.2",
  src = c(href = "https://unpkg.com/react-jsonschema-form/dist"),
  script = "react-jsonschema-form.js"
)

tl_react <- browsable(
  tagList(
    tags$head(
      tags$script(src="https://unpkg.com/react-jsonschema-form/dist/react-jsonschema-form.js")
    ),
    tags$div(id="app"),
    tags$script(
      HTML(
        sprintf(
'
const Form =JSONSchemaForm.default;
const schema = %s;
const formData = %s;

const log = (type) => console.log.bind(console, type);

ReactDOM.render((
  <Form
    schema={schema}
    formData={formData}
    onChange={log("changed")}
    onSubmit={log("submitted")}
    onError={log("errors")} />
), document.getElementById("app"));

',
jsonlite::toJSON(sch, auto_unbox=TRUE),
jsonlite::toJSON(mtcars, auto_unbox=TRUE, dataframe="rows")
        ) %>>% reactR::babel_transform()        
      )
    ),
    reactR::html_dependency_react(),
    dep_reactform,
    rmarkdown::html_dependency_jquery(),
    rmarkdown::html_dependency_bootstrap("default")
  )
)

tl_react
