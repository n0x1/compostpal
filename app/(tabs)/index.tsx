import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Platform, Button, View, ActivityIndicator, ScrollView } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import * as ImagePicker from 'expo-image-picker';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { fetch, decodeJpeg } from '@tensorflow/tfjs-react-native';
import { useFonts } from 'expo-font';

import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    'EarthyFont': require('@/assets/fonts/CalSans-Regular.ttf'), // Replace with an actual earthy font file
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B8E23" />
      </View>
    );
  }

  return <HomeScreenContent />;
}

function HomeScreenContent() {
  const modelRef = useRef<mobilenet.MobileNet | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

// Predefined mapping for common items with very broad and vague terms. This is used to classify the waste without extraneous use of language models.
const predefinedMapping: Record<string, string[]> = {
  compost: [
    // All common fruit names
    'apple', 'banana', 'orange', 'watermelon', 'grape', 'pear', 'peach', 'plum', 'cherry', 'strawberry', 'blueberry', 'blackberry', 'raspberry',
    'pineapple', 'mango', 'papaya', 'kiwi', 'apricot', 'pomegranate', 'fig', 'nectarine', 'apples', 'cantaloupe', 'melon', 'tangerine', 'lemon', 'lime',
    'coconut', 'grapefruit', 'persimmon', 'kumquat', 'lychee', 'dragonfruit', 'passionfruit', 'tomato', 'date', 'date palm', 'mulberry', 'avocado',
    'carambola', 'starfruit', 'soursop', 'jackfruit', 'durian', 'custard apple', 'sapodilla', 'cherimoya', 'loquat', 'longan',
    // Common vegetable-related compostables
    'potato', 'carrot', 'onion', 'garlic', 'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'brussels sprout', 'cabbage', 'celery', 'cucumber',
    'eggplant', 'bell pepper', 'zucchini', 'asparagus', 'green bean', 'pea', 'squash', 'pumpkin', 'sweet potato', 'radish', 'beetroot', 'turnip', 'parsnip',
    'leek', 'shallot', 'corn', 'tomato', 'artichoke', 'chard', 'fennel', 'dandelion', 'arugula', 'watercress', 'spinach',
    // Plant material (general)
    'leaf', 'stem', 'root', 'rind', 'pod', 'skin', 'core', 'bark', 'seeds', 'pulp', 'pit', 'flower', 'herb', 'weed', 'grass', 'branch', 'shrub',
    'tree branch', 'cuttings', 'pruning', 'compostable', 'garden waste', 'manure', 'compostable packaging',
    // Organic food waste (miscellaneous)
    'bread', 'pasta', 'noodle', 'rice', 'grains', 'pita', 'bagel', 'tortilla', 'pizza crust', 'leftover food', 'cooked food', 'meal scrap', 'stale food',
    'eggshell', 'coffee grounds', 'tea bag', 'chocolate', 'candy', 'chips', 'snack', 'popcorn', 'cookie', 'cake', 'pie', 'muffin', 'fruit peel', 'citrus peel',
    // Other compostable food scraps
    'apple core', 'banana peel', 'orange peel', 'peach pit', 'avocado pit', 'grapefruit rind', 'melon rind', 'tomato stem', 'carrot top', 'lettuce leaf',
    'potato peel', 'corn husk', 'onion skin', 'garlic skin', 'green bean ends', 'coffee filter', 'tea leaves', 'egg carton', 'paper towel', 'napkin', 'straw',
    // Compostable kitchen waste (more general)
    'compostable packaging', 'paper bag', 'paper napkin', 'paper towel', 'cork', 'wood', 'cotton', 'bamboo', 'wood chips', 'sawdust', 'straw',
    'coconut shell', 'coconut husk', 'pinecone', 'acorn', 'nut shell', 'egg carton', 'dried flower', 'grass clippings', 'mulch', 'autumn leaves', 'pine needles',
    'moss', 'lawn clippings', 'leaves', 'weeds', 'sawdust', 'manure', 'farming waste', 'composting waste', 'compostable container', 'garden waste',
    'organic waste', 'compost bin', 'soil additive', 'green waste', 'organic matter', 'biodegradable', 'plant material',
  ],
  recycle: [
    // Paper and cardboard products (general)
    'paper', 'cardboard', 'newspaper', 'magazine', 'journal', 'book', 'notepad', 'envelope', 'poster', 'letter', 'ticket', 'receipt', 'brochure',
    'catalogue', 'flyer', 'carton', 'box', 'bag', 'wrap', 'label', 'sheet', 'pad', 'napkin',
    // Plastics (general containers and packaging)
    'plastic', 'container', 'bottle', 'jar', 'cup', 'canister', 'box', 'wrap', 'tray', 'film', 'straw', 'bag', 'tub', 'lid', 'tray', 'film',
    'carton', 'plastic wrap', 'clamshell', 'plastic sheet', 'plastic bag', 'clamshell packaging', 'disposable',
    // Metal and aluminum
    'metal', 'can', 'aluminum', 'foil', 'tin', 'steel', 'aerosol', 'screw', 'nuts', 'bolt',
    // Glass and ceramic
    'glass', 'bottle', 'jar', 'vase', 'window', 'mirror', 'dish', 'cup', 'container', 'beaker', 'tumbler',
    // Electronic waste
    'battery', 'charger', 'cord', 'cable', 'phone', 'tablet', 'laptop', 'speaker', 'headphone', 'microwave', 'TV', 'radio', 'remote', 'lightbulb',
    'ipod',  // Added iPod under recycle
    // Miscellaneous recyclable items
    'furniture', 'appliance', 'electronics', 'recyclable waste', 'plastic container', 'tote', 'plastic utensil', 'foil tray', 'plastic cup',
    // Textiles must be recycled in Massachusetts!
    'clothes', 'shirt', 'pants', 'hat', 'shoes', 'sweater', 'jacket', 'coat', 'dress', 'skirt', 'blouse', 'jeans', 'shorts'
  ],
  trash: [
    // Non-recyclable plastics and containers
    'non-recyclable plastic', 'spray', 'disposable plastic', 'styrofoam', 'plastic wrap', 'plastic film', 'single-use', 'non-recyclable packaging', 'trash bag', 'wrapper',
    // Common waste items (general trash)
    'trash', 'waste', 'bag', 'wrapper', 'styrofoam', 'plastic bag', 'shoe', 'clothing', 'furniture', 'pen', 'toothbrush', 'broken', 'worn', 'garbage', 'litter',
    'food wrapper', 'tissue', 'paper towel', 'gum', 'cigarette', 'candy wrapper', 'plastic fork', 'spoon', 'knife', 'plate', 'cutlery',
    // Hazardous waste
    'toxic', 'chemical', 'paint', 'battery', 'lighter', 'aerosol', 'cleaner', 'pesticide', 'medicine', 'sharp object', 'broken glass', 'mercury', 'acid', 'oil',
    // Old, damaged items
    'old furniture', 'broken appliance', 'broken device', 'damaged electronics', 'shredded paper', 'damaged box', 'ruined book', 'cracked mirror', 'broken chair',
    // Mixed waste and non-compostables
    'rubber', 'fabric', 'leather', 'vinyl', 'latex', 'foil', 'waxed paper', 'plastic film', 'foam', 'gum wrapper', 'gift wrap', 'ribbon', 'string', 'tape',
    'diaper', 'sanitary product', 'old carpet', 'broken toy', 'old phone', 'packet'
  ],
};


  useEffect(() => {
    async function prepare() {
      await tf.ready();
      console.log('TensorFlow loaded');
    }
    prepare();
  }, []);

  useEffect(() => {
    async function loadModel() {
      if (!modelRef.current) {
        modelRef.current = await mobilenet.load();
        console.log('MobileNet model loaded');
      }
    }
    loadModel();
  }, []);

  const getPredefinedCategory = (className: string): string | null => {
    const lowerClassName = className.toLowerCase();
    for (const [category, keywords] of Object.entries(predefinedMapping)) {
      if (keywords.some((keyword) => lowerClassName.includes(keyword.toLowerCase()))) {
        return category.charAt(0) + category.slice(1); 
      }
    }
    return 'Unknown';
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permission to access the camera is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      setCategory(null);
      setClassification(null);
      setIsProcessingImage(true);

      try {
        const response = await fetch(imageUri, {}, { isBinary: true });
        const imageData = new Uint8Array(await response.arrayBuffer());
        const imageTensor = decodeJpeg(imageData);

        if (modelRef.current) {
          const predictions = await modelRef.current.classify(imageTensor);
          const topPrediction = predictions[0];
          console.log('Classification:', topPrediction.className); // Print classification to the terminal

          const predefinedCategory = getPredefinedCategory(topPrediction.className);
          setCategory(predefinedCategory);
          setClassification(topPrediction.className);
        } else {
          console.log('Model is not loaded yet');
        }
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.reactLogo}
        />
      </View>
      <ThemedView style={styles.stepContainer}>
        <View style={{ marginTop: 16 }}>
          <Button
            title="Take Photo"
            onPress={handleImagePick}
            color="#6B8E23" // Earthy green button
          />
        </View>

        {isProcessingImage && <ActivityIndicator size="large" color="#8B4513" />}
        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.image} />
        )}
        <ThemedText style={styles.sectionTitle} type="title">Classification</ThemedText>
        <ThemedText style={styles.classificationText}>
          {category === 'Unknown'
            ? `${classification}: Unable to classify object`
            : category || (isProcessingImage ? 'Classifying...' : 'No classification yet')}
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8DC', // Match the category section background
  },
  header: {
    height: 200, // Reduced height for the header
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8DC', // Match the category section background
    paddingTop: 10, // Reduced padding at the top
  },
  reactLogo: {
    height: 150, // Reduced height for the logo
    width: 240, // Adjusted width to maintain aspect ratio
  },
  stepContainer: {
    gap: 0,
    marginBottom: 8,
    backgroundColor: '#FFF8DC', // Match the category section background
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontFamily: 'EarthyFont',
    fontSize: 24,
    color: '#8B4513', // Earthy brown
    marginTop: 16,
  },
  categoryText: {
    fontFamily: 'EarthyFont',
    fontSize: 20,
    color: '#6B8E23', // Earthy green
  },
  classificationText: {
    fontFamily: 'EarthyFont',
    fontSize: 18,
    color: '#6B8E23', // Earthy green
    marginTop: 8,
    textAlign: 'center', // Center-align the text
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B4513', // Earthy brown border
  },
});
