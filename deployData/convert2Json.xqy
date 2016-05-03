xquery version "3.0";
declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare namespace json="http://www.json.org";
(:declare option output:method "json";:)
(:declare option output:media-type "application/json";:)
(:declare option output:indent "yes";:)
let $col:=collection('/db/apps/S5M-Migrate')

let $xml:=
<children>
    {for $item in $col//item[position()<12]
    return
    
    <docs>    
        <flashcard>
            <commited json:literal="true">true</commited>
            <content>
                <title>{data($item/Q)}</title>
                <id>1</id>
                <formatVersion>2</formatVersion>
                <ideas>
                    {for $idea at $i in tokenize($item/A, "&lt;br/&gt;")
                    where (normalize-space($idea)!="")
                        return
                            element {"aaaa"||$i} {
                            <title>{normalize-space($idea)}</title>,
                            <id json:literal="true">{$i +1}</id>    
                            }
                    }
                </ideas>
            </content>   
        </flashcard>
    </docs>
    }
    </children>
return
    replace(util:serialize($xml, "method=json media-type=text/javascript"), "aaaa", "")