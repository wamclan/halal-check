/* Pure conservative helpers shared between browser and tests. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.HalalScanUtils=api;
})(typeof self!=="undefined"?self:this,function(){
  "use strict";
  function normalized(value) {
    return String(value==null?"":value).normalize("NFKD")
      .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,"")
      .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
      .toLocaleLowerCase().replace(/\s+/g," ").trim();
  }
  function wordsOverlap(a,b) {
    const x=normalized(a),y=normalized(b);
    if(!x||!y||x.length<4||y.length<4)return false;
    return x.includes(y)||y.includes(x);
  }
  // The AI transcription can suggest several subspans of the same ingredient.
  // Deduplicate against source-backed rule matches and other AI hints.
  function mergeSuggestions(items,extras,ingredients) {
    const merged=Array.isArray(items)?items.slice():[];
    const printed=normalized(ingredients);
    const sourceMatches=merged.filter(item=>item.status==="warn"||item.status==="bad")
      .map(item=>[item.seg,typeof item.name==="string"?item.name:item.name&&item.name.en])
      .flat().filter(Boolean);
    const suggestions=Array.isArray(extras)?extras.slice(0,6):[];
    suggestions.sort((a,b)=>String(b?.term||"").length-String(a?.term||"").length);
    const kept=[];
    for(const suggestion of suggestions){
      const term=String(suggestion?.term||"").trim();
      if(term.length<4||!printed.includes(normalized(term)))continue;
      if(sourceMatches.some(x=>wordsOverlap(x,term)))continue;
      if(kept.some(x=>wordsOverlap(x.term,term)))continue;
      const reason=String(suggestion?.reason||"").trim();
      kept.push({term,reason});
    }
    for(const x of kept)merged.push({status:"warn",name:x.term,why:x.reason,ai:true});
    return merged;
  }
  function selectedFileChanged(oldFile,newFile){
    return oldFile!==newFile;
  }
  return {normalized,wordsOverlap,mergeSuggestions,selectedFileChanged};
});