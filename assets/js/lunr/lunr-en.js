var idx = lunr(function () {
  this.field('title', { boost: 30 })
  this.field('excerpt', { boost: 8 })
  this.field('categories', { boost: 6 })
  this.field('tags', { boost: 6 })
  this.field('content')
  this.ref('id')

  this.pipeline.remove(lunr.trimmer)

  for (var item in store) {
    this.add({
      title: store[item].title,
      excerpt: store[item].excerpt,
      categories: store[item].categories,
      tags: store[item].tags,
      content: store[item].content,
      id: item
    })
  }
});

$(document).ready(function() {
  $('input#search').on('keyup', function () {
    var resultdiv = $('#results');
    var query = $(this).val().toLowerCase();
    var result =
      idx.query(function (q) {
        query.split(lunr.tokenizer.separator).forEach(function (term) {
          q.term(term, { boost: 100 })
          if(query.lastIndexOf(" ") != query.length-1){
            q.term(term, { usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 })
          }
          if (term != ""){
            q.term(term, { usePipeline: false, editDistance: 1, boost: 1 })
          }
        })
      });
    resultdiv.empty();
    resultdiv.prepend('<p class="eh-search-results__count">'+result.length+' result'+(result.length === 1 ? '' : 's')+' found</p>');
    for (var item in result) {
      var ref = result[item].ref;
      var summary = store[ref].excerpt || store[ref].content || '';
      if(store[ref].teaser){
        var searchitem =
          '<div class="eh-search-results__item">'+
            '<article class="eh-search-result" itemscope itemtype="https://schema.org/CreativeWork">'+
              '<h2 class="eh-search-result__title" itemprop="headline">'+
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>'+
              '</h2>'+
              '<div class="eh-search-result__teaser">'+
                '<img src="'+store[ref].teaser+'" alt="">'+
              '</div>'+
              '<p class="eh-search-result__excerpt" itemprop="description">'+summary.split(" ").splice(0,20).join(" ")+'...</p>'+
            '</article>'+
          '</div>';
      }
      else{
    	  var searchitem =
          '<div class="eh-search-results__item">'+
            '<article class="eh-search-result" itemscope itemtype="https://schema.org/CreativeWork">'+
              '<h2 class="eh-search-result__title" itemprop="headline">'+
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>'+
              '</h2>'+
              '<p class="eh-search-result__excerpt" itemprop="description">'+summary.split(" ").splice(0,20).join(" ")+'...</p>'+
            '</article>'+
          '</div>';
      }
      resultdiv.append(searchitem);
    }
  });
});
