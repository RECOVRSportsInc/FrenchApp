// Authored dialogue. MSA is a learning register, not a regional spoken dialect.
const groceryDialogue = {
  title: ['Faire les courses', 'شراء البقالة', 'Buying groceries'],
  character: ['Camille', 'ليلى', 'Shopkeeper'],
  welcome: {
    line: ['Bonjour ! Qu’est-ce qu’il vous faut aujourd’hui ?', 'مرحبًا! ماذا تحتاج اليوم؟', 'Hello! What do you need today?'],
    task: 'Greet the shopkeeper and ask for apples or bananas.',
    choices: [
      { id: 'apples', text: ['Bonjour, je voudrais des pommes, s’il vous plaît.', 'مرحبًا، أريد تفاحًا من فضلك.', 'Hello, I’d like some apples, please.'], aliases: [['Je voudrais des pommes', 'Des pommes, s’il vous plaît', 'Bonjour, je cherche des pommes'], ['أريد تفاحا', 'أريد التفاح', 'أريد تفاحا من فضلك']] },
      { id: 'bananas', text: ['Bonjour, je voudrais des bananes, s’il vous plaît.', 'مرحبًا، أريد موزًا من فضلك.', 'Hello, I’d like some bananas, please.'], aliases: [['Je voudrais des bananes', 'Des bananes, s’il vous plaît', 'Bonjour, je cherche des bananes'], ['أريد موزا', 'أريد الموز', 'أريد موزا من فضلك']] }
    ]
  },
  stock: {
    line: ['Je n’ai plus de pommes rouges. Il me reste des pommes vertes et des bananes. Qu’est-ce que vous préférez ?', 'نفد التفاح الأحمر. لدي تفاح أخضر وموز. ماذا تفضل؟', 'I’m out of red apples. I have green apples and bananas. Which would you prefer?'],
    task: 'Choose an available alternative.',
    choices: [
      { id: 'green', text: ['Des pommes vertes, alors, s’il vous plaît.', 'تفاحًا أخضر إذن، من فضلك.', 'Green apples, then, please.'], aliases: [['Des pommes vertes', 'Je vais prendre des pommes vertes', 'Je préfère les pommes vertes'], ['أريد تفاحا أخضر', 'تفاحا أخضر', 'أفضل التفاح الأخضر']] },
      { id: 'bananas', text: ['Je vais prendre des bananes, alors.', 'سآخذ موزًا إذن.', 'I’ll take bananas, then.'], aliases: [['Des bananes, alors', 'Je préfère les bananes', 'Des bananes'], ['سآخذ موزا', 'أريد موزا', 'أفضل الموز']] }
    ]
  },
  quantity: {
    line: ['Très bien. Vous en voulez combien ?', 'حسنًا. ما الكمية التي تريدها؟', 'All right. How much would you like?'],
    task: 'Ask for one or two kilograms.',
    choices: [
      { id: 'one', text: ['Un kilo, s’il vous plaît.', 'كيلوغرامًا واحدًا، من فضلك.', 'One kilogram, please.'], aliases: [['Un kilo', 'Je voudrais un kilo', 'Un kilogramme'], ['كيلوغراما واحدا', 'كيلو واحد', 'أريد كيلوغراما واحدا']] },
      { id: 'two', text: ['Deux kilos, s’il vous plaît.', 'كيلوغرامين، من فضلك.', 'Two kilograms, please.'], aliases: [['Deux kilos', 'Je voudrais deux kilos', 'Deux kilogrammes'], ['كيلوغرامين', 'كيلوين', 'أريد كيلوغرامين']] }
    ]
  },
  extra: {
    line: ['Voilà. Il vous faut autre chose ?', 'تفضل. هل تحتاج إلى شيء آخر؟', 'Here you are. Do you need anything else?'],
    task: 'Ask for milk, or say that is everything.',
    choices: [
      { id: 'milk', text: ['Oui, une bouteille de lait, s’il vous plaît.', 'نعم، زجاجة حليب من فضلك.', 'Yes, a bottle of milk, please.'], aliases: [['Une bouteille de lait', 'Je voudrais aussi du lait', 'Du lait, s’il vous plaît'], ['زجاجة حليب', 'أريد حليبا أيضا', 'أريد زجاجة حليب']] },
      { id: 'done', text: ['Non merci, c’est tout.', 'لا شكرًا، هذا كل شيء.', 'No thanks, that’s everything.'], aliases: [['C’est tout', 'Non merci', 'Non, c’est tout'], ['لا شكرا', 'هذا كل شيء', 'لا هذا كل شيء']] }
    ]
  },
  milk: {
    line: ['Du lait entier ou du lait écrémé ?', 'هل تريد حليبًا كامل الدسم أم خالي الدسم؟', 'Whole milk or skimmed milk?'],
    task: 'Specify which kind of milk you want.',
    choices: [
      { id: 'whole', text: ['Du lait entier, s’il vous plaît.', 'حليبًا كامل الدسم، من فضلك.', 'Whole milk, please.'], aliases: [['Du lait entier', 'Entier', 'Je préfère le lait entier'], ['حليبا كامل الدسم', 'كامل الدسم', 'أريد حليبا كامل الدسم']] },
      { id: 'skimmed', text: ['Du lait écrémé, s’il vous plaît.', 'حليبًا خالي الدسم، من فضلك.', 'Skimmed milk, please.'], aliases: [['Du lait écrémé', 'Écrémé', 'Je préfère le lait écrémé'], ['حليبا خالي الدسم', 'خالي الدسم', 'أريد حليبا خالي الدسم']] }
    ]
  },
  price: {
    line: ['C’est tout pour vous ?', 'هل هذا كل ما تحتاجه؟', 'Is that everything for you?'],
    task: 'Ask how much the shopping costs.',
    choices: [
      { id: 'price', text: ['Oui, merci. Ça fait combien ?', 'نعم، شكرًا. كم المبلغ؟', 'Yes, thanks. How much is it?'], aliases: [['Ça fait combien', 'Combien ça coûte', 'Quel est le prix', 'Combien je vous dois'], ['كم المبلغ', 'كم السعر', 'كم التكلفة']] }
    ]
  },
  checkout: {
    line: ['Vous payez par carte ou en espèces ?', 'هل ستدفع بالبطاقة أم نقدًا؟', 'Will you pay by card or in cash?'],
    task: 'Choose how to pay.',
    choices: [
      { id: 'card', text: ['Par carte, s’il vous plaît.', 'بالبطاقة، من فضلك.', 'By card, please.'], aliases: [['Par carte', 'Je paie par carte', 'Je voudrais payer par carte'], ['بالبطاقة', 'سأدفع بالبطاقة', 'أريد الدفع بالبطاقة']] },
      { id: 'cash', text: ['En espèces.', 'نقدًا.', 'In cash.'], aliases: [['En espèces', 'Je paie en espèces', 'Je voudrais payer en espèces', 'En liquide'], ['نقدا', 'سأدفع نقدا', 'أريد الدفع نقدا']] }
    ]
  },
  payment: {
    line: ['Désolée, le terminal ne fonctionne pas. Vous pouvez payer en espèces ou attendre quelques minutes.', 'عذرًا، جهاز الدفع لا يعمل. يمكنك الدفع نقدًا أو الانتظار بضع دقائق.', 'Sorry, the card machine isn’t working. You can pay in cash or wait a few minutes.'],
    task: 'Handle the problem: pay cash or wait.',
    choices: [
      { id: 'cash', text: ['D’accord, je vais payer en espèces.', 'حسنًا، سأدفع نقدًا.', 'All right, I’ll pay in cash.'], aliases: [['Je vais payer en espèces', 'En espèces, alors', 'Je paie en espèces'], ['سأدفع نقدا', 'حسنا سأدفع نقدا', 'نقدا إذن']] },
      { id: 'wait', text: ['Je peux attendre quelques minutes.', 'يمكنني الانتظار بضع دقائق.', 'I can wait a few minutes.'], aliases: [['Je peux attendre', 'Je vais attendre', 'D’accord, j’attends'], ['يمكنني الانتظار', 'سأنتظر', 'حسنا سأنتظر']] }
    ]
  },
  bag: {
    line: ['Merci. Vous avez besoin d’un sac ?', 'شكرًا. هل تحتاج إلى كيس؟', 'Thank you. Do you need a bag?'],
    task: 'Ask for a bag or say you brought your own.',
    choices: [
      { id: 'yes', text: ['Oui, un sac, s’il vous plaît.', 'نعم، كيس من فضلك.', 'Yes, a bag, please.'], aliases: [['Oui, s’il vous plaît', 'Un sac, s’il vous plaît', 'Oui, un sac'], ['نعم من فضلك', 'كيس من فضلك', 'نعم أريد كيسا']] },
      { id: 'own', text: ['Non merci, j’ai mon sac.', 'لا شكرًا، لدي كيس.', 'No thanks, I have my own bag.'], aliases: [['J’ai mon sac', 'Non merci', 'Non, j’ai un sac'], ['لدي كيس', 'لا شكرا', 'لا لدي كيس']] }
    ]
  },
  goodbye: {
    line: ['Voilà votre ticket. Merci et bonne journée !', 'تفضل إيصالك. شكرًا، أتمنى لك يومًا سعيدًا!', 'Here’s your receipt. Thank you, have a nice day!'],
    task: 'Thank the shopkeeper and say goodbye.',
    choices: [
      { id: 'bye', text: ['Merci, bonne journée !', 'شكرًا، إلى اللقاء!', 'Thank you, goodbye!'], aliases: [['Merci, au revoir', 'Au revoir', 'Merci', 'Bonne journée'], ['شكرا إلى اللقاء', 'إلى اللقاء', 'شكرا', 'يوما سعيدا']] }
    ]
  }
};
